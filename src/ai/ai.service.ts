import { Injectable } from '@nestjs/common';
import ai from './init';
import {
    isValidGeminiNotesResponse,
    isValidNoInsightResponse,
    isValidNoIdentificationResponse,
    cleanGeminiResponseText,
} from './utils';
import { notesConfig } from './config';
import { GeminiNotesResponseDto } from './dto/response/gemini-notes-response.dto';
import { NotesService } from '../notes/notes.service';
import { GeminiCollaboratorResponseDto } from './dto/response/gemini-collaborator-response.dto';
import { GeminiEqualizationResponseDto } from './dto/response/gemini-equalization-response.dto';
import { GeminiLeaderResponseDto } from './dto/response/gemini-leader-response.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
    constructor(
        private readonly notesService: NotesService,
        private readonly prisma: PrismaService,
    ) {}

    private async generateNotesData(
        text: string,
        userId: number,
        cycleId: number,
    ): Promise<string> {
        // Busca os projetos do usuário
        const projectMemberships = await this.prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });
        const projectIds = projectMemberships.map((pm) => pm.projectId);
        // Busca apenas membros EMPLOYER dos projetos
        const projectMembers = await this.prisma.projectMember.findMany({
            where: {
                projectId: { in: projectIds },
                user: {
                    userRoles: {
                        some: { role: 'EMPLOYER', isActive: true },
                    },
                },
            },
            include: {
                user: true,
            },
        });
        const collaborators = projectMembers
            .filter((pm) => pm.user.id !== userId)
            .map((pm) => ({
                id: pm.user.id,
                name: pm.user.name,
                email: pm.user.email,
                position: pm.user.position,
            }));

        if (collaborators.length === 0) {
            throw new Error(
                'Não há colaboradores elegíveis associados ao usuário para gerar o resumo.',
            );
        }

        // Busca o mentor do colaborador
        const mentor = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { mentor: true },
        });

        const mentorData = mentor?.mentor
            ? {
                  id: mentor.mentor.id,
                  name: mentor.mentor.name,
                  email: mentor.mentor.email,
                  position: mentor.mentor.position,
              }
            : null;

        // Busca os critérios de avaliação da trilha do colaborador no ciclo
        const trackCriteria = await this.prisma.criterionTrackCycleConfig.findMany({
            where: {
                trackId: mentor?.trackId,
                cycleId: cycleId,
            },
            include: {
                criterion: true,
            },
        });

        const criterios = trackCriteria.map((tc) => ({
            id: tc.criterion.id,
            name: tc.criterion.name,
            description: tc.criterion.description,
            weight: tc.weight,
        }));

        return `
        [COLABORADORES]
        ${JSON.stringify(collaborators, null, 2)}
        [CRITERIOS]
        ${JSON.stringify(criterios, null, 2)}
        [MENTOR]
        ${JSON.stringify(mentorData, null, 2)}
        [TEXTO]
        ${text}
        `;
    }

    private async generateCollaboratorData(userId: number, cycleId: number): Promise<string> {
        // Busca a autoavaliação do colaborador no ciclo
        const autoEvaluation = await this.prisma.autoEvaluation.findFirst({
            where: {
                evaluation: {
                    evaluatorId: userId,
                    cycleConfigId: cycleId,
                },
            },
            include: {
                assignments: {
                    include: {
                        criterion: true,
                    },
                },
            },
        });

        const autoEvaluationData = autoEvaluation
            ? {
                  pillars: autoEvaluation.assignments.map((assignment) => ({
                      pillarId: assignment.criterion.pillarId,
                      criteria: [
                          {
                              criteriaName: assignment.criterion.name,
                              rating: assignment.score,
                              justification: assignment.justification,
                          },
                      ],
                  })),
              }
            : null;

        // Busca a avaliação do Gestor no ciclo
        const managerEvaluation = await this.prisma.managerEvaluation.findFirst({
            where: {
                cycleId: cycleId,
                collaboratorId: userId,
            },
            include: {
                criterias: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });

        const managerEvaluationData = managerEvaluation
            ? {
                  criterias: managerEvaluation.criterias.map((criteria) => ({
                      criteriaName: criteria.criteria.name,
                      rating: criteria.score,
                      justification: criteria.justification,
                  })),
              }
            : null;

        // Busca a nota final e justificativa do comitê de equalização
        const equalization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId: userId,
                cycleId: cycleId,
            },
        });

        const equalizationData = equalization
            ? {
                  score: equalization.score,
                  justification: equalization.justification,
              }
            : null;

        return `
        [AUTOAVALIAÇÃO]
        ${JSON.stringify(autoEvaluationData, null, 2)}
        [GESTOR]
        ${JSON.stringify(managerEvaluationData, null, 2)}
        [EQUALIZAÇÃO]
        ${JSON.stringify(equalizationData, null, 2)}
        `;
    }

    private async generateEqualizationData(userId: number, cycleId: number): Promise<string> {
        // Busca a autoavaliação do colaborador no ciclo
        const autoEvaluation = await this.prisma.autoEvaluation.findFirst({
            where: {
                evaluation: {
                    evaluatorId: userId,
                    cycleConfigId: cycleId,
                },
            },
            include: {
                assignments: {
                    include: {
                        criterion: true,
                    },
                },
            },
        });

        const autoEvaluationData = autoEvaluation
            ? {
                  pillars: autoEvaluation.assignments.map((assignment) => ({
                      pillarId: assignment.criterion.pillarId,
                      criteria: [
                          {
                              criteriaName: assignment.criterion.name,
                              rating: assignment.score,
                              justification: assignment.justification,
                          },
                      ],
                  })),
              }
            : null;

        // Busca as avaliações 360 que o colaborador recebeu
        const evaluation360 = await this.prisma.evaluation360.findMany({
            where: {
                evaluatedId: userId,
            },
        });

        const evaluation360Data = evaluation360.map((evaluation) => ({
            rating: evaluation.score,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
        }));

        // Busca as avaliações feitas pelos mentorados do colaborador
        const mentoringReceived = await this.prisma.mentoring.findMany({
            where: {
                mentorId: userId,
            },
        });

        const mentoringData = mentoringReceived.map((mentoring) => ({
            score: mentoring.score,
            justification: mentoring.justification,
        }));

        // Busca as referências recebidas pelo colaborador
        const references = await this.prisma.reference.findMany({
            where: {
                collaboratorId: userId,
            },
        });

        const referencesData = references.map((reference) => ({
            justification: reference.justification,
        }));

        // Busca a avaliação do Gestor no ciclo
        const managerEvaluation = await this.prisma.managerEvaluation.findFirst({
            where: {
                cycleId: cycleId,
                collaboratorId: userId,
            },
            include: {
                criterias: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });

        const managerEvaluationData = managerEvaluation
            ? {
                  criterias: managerEvaluation.criterias.map((criteria) => ({
                      criteriaName: criteria.criteria.name,
                      rating: criteria.score,
                      justification: criteria.justification,
                  })),
              }
            : null;

        return `
        [AUTOAVALIAÇÃO]
        ${JSON.stringify(autoEvaluationData, null, 2)}
        [AVALIAÇÃO 360]
        ${JSON.stringify(evaluation360Data, null, 2)}
        [MENTORADO]
        ${JSON.stringify(mentoringData, null, 2)}
        [REFERÊNCIAS]
        ${JSON.stringify(referencesData, null, 2)}
        [GESTOR]
        ${JSON.stringify(managerEvaluationData, null, 2)}
        `;
    }

    private async generateLeaderData(userId: number, cycleId: number): Promise<string> {
        // Busca as autoavaliações dos colaboradores liderados
        const autoEvaluations = await this.prisma.autoEvaluation.findMany({
            where: {
                evaluation: {
                    evaluator: {
                        mentorId: userId,
                    },
                    cycleConfigId: cycleId,
                },
            },
            include: {
                assignments: {
                    include: {
                        criterion: true,
                    },
                },
            },
        });

        const autoEvaluationData = autoEvaluations.map((evaluation) => ({
            collaboratorId: evaluation.evaluationId,
            pillars: evaluation.assignments.map((assignment) => ({
                pillarId: assignment.criterion.pillarId,
                criteria: [
                    {
                        criteriaName: assignment.criterion.name,
                        rating: assignment.score,
                        justification: assignment.justification,
                    },
                ],
            })),
        }));

        // Busca as avaliações que o líder deu para os seus liderados
        const leaderEvaluations = await this.prisma.leaderEvaluation.findMany({
            where: {
                leaderId: userId,
                cycleId: cycleId,
            },
        });

        const leaderEvaluationData = leaderEvaluations.map((evaluation) => ({
            collaboratorId: evaluation.collaboratorId,
            score: evaluation.score,
            justification: evaluation.justification,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
        }));

        // Busca as avaliações do gestor para os liderados
        const managerEvaluations = await this.prisma.managerEvaluation.findMany({
            where: {
                cycleId: cycleId,
                collaboratorId: {
                    in: leaderEvaluations.map((evaluation) => evaluation.collaboratorId),
                },
            },
            include: {
                criterias: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });

        const managerEvaluationData = managerEvaluations.map((evaluation) => ({
            collaboratorId: evaluation.collaboratorId,
            criterias: evaluation.criterias.map((criteria) => ({
                criteriaName: criteria.criteria.name,
                rating: criteria.score,
                justification: criteria.justification,
            })),
        }));

        // Busca as avaliações do comitê de equalização
        const equalizations = await this.prisma.equalization.findMany({
            where: {
                collaboratorId: {
                    in: leaderEvaluations.map((evaluation) => evaluation.collaboratorId),
                },
                cycleId: cycleId,
            },
        });

        const equalizationData = equalizations.map((equalization) => ({
            collaboratorId: equalization.collaboratorId,
            score: equalization.score,
            justification: equalization.justification,
        }));

        return `
        [AUTOAVALIAÇÕES]
        ${JSON.stringify(autoEvaluationData, null, 2)}
        [AVALIAÇÕES DO LÍDER]
        ${JSON.stringify(leaderEvaluationData, null, 2)}
        [AVALIAÇÕES DO GESTOR]
        ${JSON.stringify(managerEvaluationData, null, 2)}
        [EQUALIZAÇÕES]
        ${JSON.stringify(equalizationData, null, 2)}
        `;
    }

    async gerarAvaliacaoPorAnotacoes(
        userId: number,
        cycleId: number,
    ): Promise<GeminiNotesResponseDto> {
        const { notes } = await this.notesService.getNoteByUserId(userId);
        const prompt = await this.generateNotesData(notes, userId, cycleId);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: notesConfig.systemInstruction,
                    temperature: notesConfig.temperature,
                    topP: notesConfig.topP,
                    maxOutputTokens: notesConfig.maxOutputTokens,
                    responseMimeType: notesConfig.responseMimeType,
                    thinkingConfig: notesConfig.thinkingConfig,
                },
            });

            const resposta = cleanGeminiResponseText(response.text ?? '');

            if (!resposta) {
                return {
                    code: 'ERROR',
                    error: 'A resposta gerada está vazia ou inválida.',
                };
            }

            let resumoObj: unknown;
            try {
                resumoObj = JSON.parse(resposta);
            } catch {
                return {
                    code: 'ERROR',
                    error: 'Erro ao decodificar JSON',
                };
            }

            if (isValidNoInsightResponse(resumoObj)) {
                return { code: 'NO_INSIGHT' };
            } else if (isValidNoIdentificationResponse(resumoObj)) {
                const obj = resumoObj as { written: string; applicable: string[] };
                return {
                    code: 'NO_IDENTIFICATION',
                    written: obj.written,
                    applicable: Array.isArray(obj.applicable) ? obj.applicable : [],
                };
            } else if (isValidGeminiNotesResponse(resumoObj as GeminiNotesResponseDto)) {
                const r = resumoObj as GeminiNotesResponseDto;
                return {
                    code: 'SUCCESS',
                    selfAssessment: Array.isArray(r.selfAssessment) ? r.selfAssessment : [],
                    evaluation360: Array.isArray(r.evaluation360) ? r.evaluation360 : [],
                    mentoring:
                        typeof r.mentoring === 'object' || r.mentoring === null
                            ? r.mentoring
                            : null,
                    references: Array.isArray(r.references) ? r.references : [],
                };
            } else {
                return {
                    code: 'ERROR',
                    error: 'Resposta da IA fora do padrão esperado.',
                };
            }
        } catch (error) {
            console.error('Erro desconhecido:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao processar a avaliação.',
            };
        }
    }

    async gerarResumoColaborador(
        userId: number,
        cycleId: number,
    ): Promise<GeminiCollaboratorResponseDto> {
        const prompt = await this.generateCollaboratorData(userId, cycleId);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction: notesConfig.systemInstruction },
            });
            const resposta = cleanGeminiResponseText(response.text ?? '');
            if (!resposta) {
                return { code: 'ERROR', error: 'A resposta gerada está vazia ou inválida.' };
            }
            let obj: any;
            try {
                obj = JSON.parse(resposta);
            } catch {
                return { code: 'ERROR', error: 'Erro ao decodificar JSON' };
            }
            if (obj.code === 'NO_INSIGHT') {
                return { code: 'NO_INSIGHT' };
            }
            if (obj.code === 'SUCCESS') {
                return {
                    code: 'SUCCESS',
                    summary: obj.summary,
                };
            }
            return { code: 'ERROR', error: 'Formato inesperado.' };
        } catch (error) {
            console.error('Erro desconhecido:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao processar resumo.',
            };
        }
    }

    async gerarEqualization(
        userId: number,
        cycleId: number,
    ): Promise<GeminiEqualizationResponseDto> {
        const prompt = await this.generateEqualizationData(userId, cycleId);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction: notesConfig.systemInstruction },
            });
            const resposta = cleanGeminiResponseText(response.text ?? '');
            if (!resposta) {
                return { code: 'ERROR', error: 'A resposta gerada está vazia ou inválida.' };
            }
            let obj: any;
            try {
                obj = JSON.parse(resposta);
            } catch {
                return { code: 'ERROR', error: 'Erro ao decodificar JSON' };
            }
            if (obj.code === 'NO_INSIGHT') {
                return { code: 'NO_INSIGHT' };
            }
            if (obj.code === 'SUCCESS') {
                return {
                    code: 'SUCCESS',
                    rating: obj.rating,
                    detailedAnalysis: obj.detailedAnalysis,
                    summary: obj.summary,
                    discrepancies: obj.discrepancies,
                };
            }
            return { code: 'ERROR', error: 'Formato inesperado.' };
        } catch (error) {
            console.error('Erro desconhecido:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao processar resumo.',
            };
        }
    }

    async gerarResumoLeader(userId: number, cycleId: number): Promise<GeminiLeaderResponseDto> {
        const prompt = await this.generateLeaderData(userId, cycleId);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction: notesConfig.systemInstruction },
            });
            const resposta = cleanGeminiResponseText(response.text ?? '');
            if (!resposta) {
                return { code: 'ERROR', error: 'A resposta gerada está vazia ou inválida.' };
            }
            let obj: any;
            try {
                obj = JSON.parse(resposta);
            } catch {
                return { code: 'ERROR', error: 'Erro ao decodificar JSON' };
            }
            if (obj.code === 'NO_INSIGHT') {
                return { code: 'NO_INSIGHT' };
            }
            if (obj.code === 'SUCCESS') {
                return {
                    code: 'SUCCESS',
                    summary: obj.summary,
                };
            }
            return { code: 'ERROR', error: 'Formato inesperado.' };
        } catch (error) {
            console.error('Erro desconhecido:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao processar resumo.',
            };
        }
    }
}
