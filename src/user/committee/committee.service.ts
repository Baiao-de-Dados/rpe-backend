import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SaveEqualizationDto } from './dto/save-equalization.dto';
import { getBrazilDate } from 'src/cycles/utils';
import { UserRole } from '@prisma/client';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class CommitteeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService,
    ) {}

    async getDashboardMetrics(committeeId: number) {
        // Buscar ciclo ativo
        const activeCycle = await this.prisma.cycleConfig.findFirst({
            where: {
                done: false,
                startDate: { lte: new Date(getBrazilDate()) },
                endDate: { gte: new Date(getBrazilDate()) },
            },
        });

        if (!activeCycle) {
            return {
                totalCollaborators: 0,
                pendingEqualizations: 0,
                completedEqualizations: 0,
                completionPercentage: 0,
                daysToDeadline: 0,
                deadlineDate: null,
            };
        }

        // Buscar todos os colaboradores (role EMPLOYER)
        const allCollaborators = await this.prisma.user.findMany({
            include: {
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        // Filtrar apenas usuários com role EMPLOYER
        const employers = allCollaborators.filter(user => 
            user.userRoles.some(ur => ur.role === UserRole.EMPLOYER)
        );

        const totalCollaborators = employers.length;
        const collaboratorIds = employers.map(e => e.id);

        // Buscar equalizações completadas
        const completedEqualizations = await this.prisma.equalization.count({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: activeCycle.id,
            },
        });

        const pendingEqualizations = totalCollaborators - completedEqualizations;
        const completionPercentage = totalCollaborators > 0 ? Math.round((completedEqualizations / totalCollaborators) * 100) : 0;

        // Calcular dias até o deadline
        const now = new Date(getBrazilDate());
        const deadline = activeCycle.endDate;
        const daysToDeadline = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
            totalCollaborators,
            pendingEqualizations,
            completedEqualizations,
            completionPercentage,
            daysToDeadline,
            deadlineDate: deadline?.toISOString().split('T')[0] || null,
        };
    }

    async getCollaboratorsSummary(committeeId: number) {
        // Buscar ciclo ativo
        const activeCycle = await this.prisma.cycleConfig.findFirst({
            where: {
                done: false,
                startDate: { lte: new Date(getBrazilDate()) },
                endDate: { gte: new Date(getBrazilDate()) },
            },
        });

        if (!activeCycle) {
            return [];
        }

        // Buscar TODOS os colaboradores (role EMPLOYER)
        const allCollaborators = await this.prisma.user.findMany({
            include: {
                track: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        // Filtrar apenas usuários com role EMPLOYER
        const employers = allCollaborators.filter(user => 
            user.userRoles.some(ur => ur.role === UserRole.EMPLOYER)
        );

        // Buscar avaliações do ciclo ativo
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                cycleConfigId: activeCycle.id,
            },
            include: {
                autoEvaluation: {
                    include: {
                        assignments: true,
                    },
                },
                evaluation360: true,
            },
        });

        // Buscar avaliações de manager
        const managerEvaluations = await this.prisma.managerEvaluation.findMany({
            where: {
                cycleId: activeCycle.id,
            },
            include: {
                criterias: true,
            },
        });

        // Buscar equalizações
        const equalizations = await this.prisma.equalization.findMany({
            where: {
                cycleId: activeCycle.id,
            },
        });

        const result = employers.map(collaborator => {
            // Buscar avaliação do colaborador (se existir)
            const evaluation = evaluations.find(e => e.evaluatorId === collaborator.id);

            // Calcular nota da autoavaliação
            let autoEvaluationScore: number | null = null;
            if (evaluation?.autoEvaluation?.assignments && evaluation.autoEvaluation.assignments.length > 0) {
                const sum = evaluation.autoEvaluation.assignments.reduce((acc, a) => acc + a.score, 0);
                autoEvaluationScore = Math.round((sum / evaluation.autoEvaluation.assignments.length) * 10) / 10;
            }

            // Calcular nota da avaliação 360
            let evaluation360Score: number | null = null;
            if (evaluation?.evaluation360 && evaluation.evaluation360.length > 0) {
                const sum = evaluation.evaluation360.reduce((acc, e) => acc + e.score, 0);
                evaluation360Score = Math.round((sum / evaluation.evaluation360.length) * 10) / 10;
            }

            // Calcular nota da avaliação do manager
            let managerEvaluationScore: number | null = null;
            const managerEval = managerEvaluations.find(me => me.collaboratorId === collaborator.id);
            if (managerEval?.criterias && managerEval.criterias.length > 0) {
                const sum = managerEval.criterias.reduce((acc, c) => acc + c.score, 0);
                managerEvaluationScore = Math.round((sum / managerEval.criterias.length) * 10) / 10;
            }

            // Buscar equalização
            const equalization = equalizations.find(eq => eq.collaboratorId === collaborator.id);
            const committeeEqualization: number | null = equalization?.score || null;

            const status = committeeEqualization !== null ? 'completed' : 'pending';

            return {
                collaborator: {
                    id: collaborator.id,
                    name: collaborator.name,
                    position: collaborator.position,
                    track: collaborator.track ? {
                        id: collaborator.track.id,
                        name: collaborator.track.name,
                    } : null,
                },
                autoEvaluation: autoEvaluationScore,
                evaluation360: evaluation360Score,
                managerEvaluation: managerEvaluationScore,
                committeeEqualization,
                status,
            };
        });

        return result;
    }

    async getCollaboratorEvaluationDetails(committeeId: number, collaboratorId: number, cycleConfigId: number) {
        // Buscar colaborador
        const collaborator = await this.prisma.user.findUnique({
            where: { id: collaboratorId },
            include: {
                track: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!collaborator) {
            throw new NotFoundException('Colaborador não encontrado');
        }

        // Buscar ciclo
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
        });

        if (!cycle) {
            throw new NotFoundException('Ciclo não encontrado');
        }

        // Buscar avaliação do colaborador
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: collaboratorId,
                cycleConfigId,
            },
            include: {
                autoEvaluation: {
                    include: {
                        assignments: {
                            include: {
                                criterion: true,
                            },
                        },
                    },
                },
                evaluation360: true,
            },
        });

        // Buscar avaliação do manager
        const managerEvaluation = await this.prisma.managerEvaluation.findFirst({
            where: {
                collaboratorId,
                cycleId: cycleConfigId,
            },
            include: {
                criterias: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });

        // Buscar equalização (agora inclui committee)
        const equalization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId: cycleConfigId,
            },
            include: {
                committee: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                    },
                },
            },
        });

        // Buscar dados dos avaliadores 360
        const evaluation360WithNames = await Promise.all(
            (evaluation?.evaluation360 || []).map(async (ev360) => {
                const evaluator = await this.prisma.user.findUnique({
                    where: { id: ev360.evaluatedId },
                    select: {
                        name: true,
                        position: true,
                    },
                });

                return {
                    collaboratorName: evaluator?.name || 'Usuário não encontrado',
                    collaboratorPosition: evaluator?.position || '',
                    rating: ev360.score,
                    improvements: ev360.improvements,
                    strengths: ev360.strengths,
                };
            })
        );

        // Formatar autoavaliação
        let autoEvaluation: any = null;
        if (evaluation?.autoEvaluation?.assignments && evaluation.autoEvaluation.assignments.length > 0) {
            const score = evaluation.autoEvaluation.assignments.reduce((acc, a) => acc + a.score, 0) / evaluation.autoEvaluation.assignments.length;
            const criteria = evaluation.autoEvaluation.assignments.map(a => ({
                pilarId: a.criterion.pillarId,
                criterionId: a.criterionId,
                rating: a.score,
                justification: a.justification,
            }));

            autoEvaluation = {
                score: Math.round(score * 10) / 10,
                criteria,
            };
        }

        // Formatar avaliação do manager
        let managerEvaluationFormatted: any = null;
        if (managerEvaluation?.criterias && managerEvaluation.criterias.length > 0) {
            const score = managerEvaluation.criterias.reduce((acc, c) => acc + c.score, 0) / managerEvaluation.criterias.length;
            const criteria = managerEvaluation.criterias.map(c => ({
                pilarId: c.criteria.pillarId,
                criterionId: c.criteriaId,
                rating: c.score,
                justification: c.justification,
            }));

            managerEvaluationFormatted = {
                score: Math.round(score * 10) / 10,
                criteria,
            };
        }

        return {
            collaborator: {
                id: collaborator.id,
                name: collaborator.name,
                position: collaborator.position,
                email: collaborator.email,
                track: collaborator.track ? {
                    id: collaborator.track.id,
                    name: collaborator.track.name,
                } : null,
            },
            cycle: {
                id: cycle.id,
                name: cycle.name,
                startDate: cycle.startDate?.toISOString().split('T')[0] || null,
                endDate: cycle.endDate?.toISOString().split('T')[0] || null,
            },
            autoEvaluation,
            evaluation360: evaluation360WithNames,
            managerEvaluation: managerEvaluationFormatted,
            committeeEqualization: equalization ? {
                finalScore: equalization.score,
                comments: equalization.justification,
                aiSummary: equalization.aiSummary,
                committee: equalization.committee ? {
                    id: equalization.committee.id,
                    name: equalization.committee.name,
                    position: equalization.committee.position,
                } : null,
                lastUpdated: equalization.updatedAt.toISOString(),
            } : null,
        };
    }

    async saveEqualization(dto: SaveEqualizationDto, committeeId: number) {
        const { cycleConfigId, collaboratorId, equalization } = dto;

        // Verificar se o colaborador existe
        const collaborator = await this.prisma.user.findUnique({
            where: { id: collaboratorId },
        });

        if (!collaborator) {
            throw new NotFoundException('Colaborador não encontrado');
        }

        // Verificar se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
        });

        if (!cycle) {
            throw new NotFoundException('Ciclo não encontrado');
        }

        // Verificar se existe avaliação do colaborador
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: collaboratorId,
                cycleConfigId,
            },
        });

        if (!evaluation) {
            throw new BadRequestException('Colaborador não possui avaliação neste ciclo');
        }



        // Buscar equalização existente
        const existingEqualization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId: cycleConfigId,
            },
        });

        if (existingEqualization) {
            // Atualizar equalização existente
            const updatedEqualization = await this.prisma.equalization.update({
                where: { id: existingEqualization.id },
                data: {
                    score: equalization.score,
                    justification: equalization.justification,
                    aiSummary: equalization.aiSummary,
                    committeeId,
                },
                include: {
                    committee: {
                        select: {
                            id: true,
                            name: true,
                            position: true,
                        },
                    },
                },
            });

            return {
                message: 'Equalização atualizada com sucesso',
                equalization: updatedEqualization,
                history: {
                    previousScore: existingEqualization.score,
                    newScore: equalization.score,
                    changeReason: equalization.changeReason || 'Atualização de equalização',
                    changedBy: committeeId,
                    changedAt: new Date(),
                },
            };
        } else {
            // Criar nova equalização
            const newEqualization = await this.prisma.equalization.create({
                data: {
                    collaboratorId,
                    cycleId: cycleConfigId,
                    committeeId,
                    score: equalization.score,
                    justification: equalization.justification,
                    aiSummary: equalization.aiSummary,
                },
                include: {
                    committee: {
                        select: {
                            id: true,
                            name: true,
                            position: true,
                        },
                    },
                },
            });

            return {
                message: 'Equalização criada com sucesso',
                equalization: newEqualization,
            };
        }
    }

    async getEqualization(committeeId: number, collaboratorId: number, cycleConfigId: number) {
        // Verificar se o colaborador existe
        const collaborator = await this.prisma.user.findUnique({
            where: { id: collaboratorId },
        });

        if (!collaborator) {
            throw new NotFoundException('Colaborador não encontrado');
        }

        // Verificar se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
        });

        if (!cycle) {
            throw new NotFoundException('Ciclo não encontrado');
        }

        // Buscar equalização existente
        const equalization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId: cycleConfigId,
            },
            include: {
                committee: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                    },
                },
            },
        });

        if (!equalization) {
            throw new NotFoundException('Equalização não encontrada para este colaborador e ciclo');
        }

        return equalization;
    }

    async getEqualizationHistory(committeeId: number, collaboratorId: number, cycleConfigId: number) {
        // Verificar se o colaborador existe
        const collaborator = await this.prisma.user.findUnique({
            where: { id: collaboratorId },
        });

        if (!collaborator) {
            throw new NotFoundException('Colaborador não encontrado');
        }

        // Verificar se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
        });

        if (!cycle) {
            throw new NotFoundException('Ciclo não encontrado');
        }

        // Buscar equalização
        const equalization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId: cycleConfigId,
            },
        });

        if (!equalization) {
            throw new NotFoundException('Equalização não encontrada para este colaborador e ciclo');
        }

        // Buscar histórico
        const history = await this.prisma.equalizationHistory.findMany({
            where: {
                equalizationId: equalization.id,
            },
            include: {
                committee: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return history;
    }

    async generateAiSummary(committeeId: number, collaboratorId: number, cycleConfigId: number) {
        // Verificar se o colaborador existe
        const collaborator = await this.prisma.user.findUnique({
            where: { id: collaboratorId },
        });

        if (!collaborator) {
            throw new NotFoundException('Colaborador não encontrado');
        }

        // Verificar se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
        });

        if (!cycle) {
            throw new NotFoundException('Ciclo não encontrado');
        }

        // Verificar se existe avaliação do colaborador
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: collaboratorId,
                cycleConfigId,
            },
        });

        if (!evaluation) {
            throw new BadRequestException('Colaborador não possui avaliação neste ciclo');
        }

        // Gerar resumo da IA
        try {
            const aiResponse = await this.aiService.gerarEqualization(collaboratorId, cycleConfigId);
            
            // Se a IA gerou um resumo com sucesso, salvar no banco
            if (aiResponse.code === 'SUCCESS') {
                // Salvar toda a resposta da IA como JSON
                const aiSummaryData = {
                    code: aiResponse.code,
                    rating: aiResponse.rating,
                    detailedAnalysis: aiResponse.detailedAnalysis,
                    summary: aiResponse.summary,
                    discrepancies: aiResponse.discrepancies,
                };
                
                // Buscar equalização existente
                const existingEqualization = await this.prisma.equalization.findFirst({
                    where: {
                        collaboratorId,
                        cycleId: cycleConfigId,
                    },
                });

                if (existingEqualization) {
                    // Atualizar equalização existente com o resumo da IA
                    await this.prisma.equalization.update({
                        where: { id: existingEqualization.id },
                        data: {
                            aiSummary: aiSummaryData,
                            committeeId,
                        },
                    });
                } else {
                    // Criar nova equalização apenas com o resumo da IA
                    await this.prisma.equalization.create({
                        data: {
                            collaboratorId,
                            cycleId: cycleConfigId,
                            committeeId,
                            aiSummary: aiSummaryData,
                            score: null, // Será preenchido depois
                            justification: '', // Será preenchido depois
                        },
                    });
                }
            }
            
            return aiResponse;
        } catch (error) {
            console.error('Erro ao gerar resumo da IA:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao gerar resumo da IA',
            };
        }
    }

    async getAiSummary(committeeId: number, collaboratorId: number, cycleConfigId: number) {
        // Verificar se o colaborador existe
        const collaborator = await this.prisma.user.findUnique({
            where: { id: collaboratorId },
        });

        if (!collaborator) {
            throw new NotFoundException('Colaborador não encontrado');
        }

        // Verificar se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
        });

        if (!cycle) {
            throw new NotFoundException('Ciclo não encontrado');
        }

        // Buscar equalização com resumo da IA
        const equalization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId: cycleConfigId,
            },
            include: {
                committee: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                    },
                },
            },
        });

        if (!equalization || !equalization.aiSummary) {
            throw new NotFoundException('Resumo da IA não encontrado para este colaborador e ciclo');
        }

        // Retornar dados específicos da IA
        return {
            collaborator: {
                id: collaborator.id,
                name: collaborator.name,
            },
            cycle: {
                id: cycle.id,
                name: cycle.name,
            },
            aiSummary: equalization.aiSummary,
            committee: equalization.committee,
            generatedAt: equalization.updatedAt,
        };
    }
} 