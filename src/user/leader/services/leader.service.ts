import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LeaderEvaluationDto } from '../dto/leader-evaluation.dto';

@Injectable()
export class LeaderService {
    constructor(private readonly prisma: PrismaService) {}

    async evaluate(dto: LeaderEvaluationDto) {
        const {
            cycleId,
            collaboratorId,
            leaderId,
            generalRating,
            generalJustification,
            strengths,
            improvements,
        } = dto;

        //Verificar se existe assignment para esse líder/colaborador/ciclo
        const assignment = await this.prisma.leaderEvaluationAssignment.findFirst({
            where: {
                cycleId,
                collaboratorId,
                leaderId,
            },
        });
        if (!assignment) {
            throw new BadRequestException(
                'Você não tem permissão para avaliar este colaborador neste ciclo.',
            );
        }

        //Verificar se já existe avaliação
        const existing = await this.prisma.leaderEvaluation.findFirst({
            where: {
                cycleId,
                collaboratorId,
                leaderId,
            },
        });

        if (existing) {
            // Atualizar avaliação existente
            return this.prisma.leaderEvaluation.update({
                where: { id: existing.id },
                data: {
                    score: generalRating,
                    justification: generalJustification,
                    strengths,
                    improvements,
                },
            });
        } else {
            // Criar nova avaliação
            return this.prisma.leaderEvaluation.create({
                data: {
                    cycleId,
                    collaboratorId,
                    leaderId,
                    score: generalRating,
                    justification: generalJustification,
                    strengths,
                    improvements,
                },
            });
        }
    }

    async getDashboardSummary(leaderId: number) {
        // Buscar todos os assignments do líder
        const assignments = await this.prisma.leaderEvaluationAssignment.findMany({
            where: { leaderId },
            include: {
                collaborator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        track: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        const collaboratorIds = assignments.map((a) => a.collaboratorId);
        const cycleIds = assignments.map((a) => a.cycleId);

        // Buscar avaliações já feitas pelo líder
        const evaluations = await this.prisma.leaderEvaluation.findMany({
            where: { leaderId },
        });

        // Média das notas dadas pelo líder
        const averageScoreGiven =
            evaluations.length > 0
                ? evaluations.reduce((sum, e) => sum + (e.score || 0), 0) / evaluations.length
                : null;

        // Buscar avaliações do gestor para os liderados deste líder
        let averageManagerScoreForMyTeam: number | null = null;
        if (collaboratorIds.length > 0) {
            const managerEvaluations = await this.prisma.managerEvaluation.findMany({
                where: {
                    collaboratorId: { in: collaboratorIds },
                    cycleId: { in: cycleIds },
                },
                include: {
                    criterias: true,
                },
            });
            // Média das médias das avaliações do gestor para cada colaborador
            const allScores = managerEvaluations.flatMap((me) => me.criterias.map((c) => c.score));
            averageManagerScoreForMyTeam =
                allScores.length > 0
                    ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
                    : null;
        }

        return {
            totalAssignments: assignments.length,
            completedEvaluations: evaluations.length,
            averageScoreGiven,
            averageManagerScoreForMyTeam,
            collaborators: assignments.map((a) => ({
                id: a.collaborator.id,
                name: a.collaborator.name,
                email: a.collaborator.email,
                position: a.collaborator.position,
                track: a.collaborator.track,
            })),
        };
    }

    async getCollaboratorsEvaluationsSummary(leaderId: number) {
        // Buscar todos os assignments do líder
        const assignments = await this.prisma.leaderEvaluationAssignment.findMany({
            where: { leaderId },
            include: {
                collaborator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        track: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                cycle: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (assignments.length === 0) {
            return [];
        }

        const collaboratorIds = assignments.map((a) => a.collaboratorId);
        const cycleIds = assignments.map((a) => a.cycleId);

        // Buscar autoavaliações dos colaboradores
        const autoEvaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluateeId: { in: collaboratorIds },
                cycleConfigId: { in: cycleIds },
            },
            include: {
                autoEvaluation: {
                    include: { assignments: true },
                },
            },
        });

        // Filtrar apenas autoavaliações (evaluatorId === evaluateeId)
        const autoEvalMap = new Map();
        for (const ev of autoEvaluations) {
            if (ev.evaluatorId === ev.evaluateeId && ev.autoEvaluation) {
                const key = `${ev.evaluateeId}-${ev.cycleConfigId}`;
                if (!autoEvalMap.has(key) || autoEvalMap.get(key).createdAt < ev.createdAt) {
                    autoEvalMap.set(key, ev);
                }
            }
        }

        // Buscar avaliações de líder (feitas por este líder)
        const leaderEvaluations = await this.prisma.leaderEvaluation.findMany({
            where: {
                leaderId,
                collaboratorId: { in: collaboratorIds },
                cycleId: { in: cycleIds },
            },
        });

        const leaderEvalMap = new Map();
        for (const le of leaderEvaluations) {
            const key = `${le.collaboratorId}-${le.cycleId}`;
            if (!leaderEvalMap.has(key) || leaderEvalMap.get(key).createdAt < le.createdAt) {
                leaderEvalMap.set(key, le);
            }
        }

        // Buscar avaliações do gestor para os colaboradores
        const managerEvaluations = await this.prisma.managerEvaluation.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: { in: cycleIds },
            },
            include: {
                criterias: true,
            },
        });

        const managerEvalMap = new Map();
        for (const me of managerEvaluations) {
            const key = `${me.collaboratorId}-${me.cycleId}`;
            if (!managerEvalMap.has(key) || managerEvalMap.get(key).createdAt < me.createdAt) {
                managerEvalMap.set(key, me);
            }
        }

        // Montar resposta
        const result: any[] = [];
        for (const assignment of assignments) {
            const autoEval = autoEvalMap.get(`${assignment.collaboratorId}-${assignment.cycleId}`);
            let autoEvalScore: number | null = null;
            if (
                autoEval &&
                autoEval.autoEvaluation &&
                autoEval.autoEvaluation.assignments.length > 0
            ) {
                const sum = autoEval.autoEvaluation.assignments.reduce(
                    (acc, a) => acc + a.score,
                    0,
                );
                autoEvalScore = sum / autoEval.autoEvaluation.assignments.length;
            }

            const leaderEval = leaderEvalMap.get(
                `${assignment.collaboratorId}-${assignment.cycleId}`,
            );
            const leaderEvalScore: number | null = leaderEval ? leaderEval.score : null;

            const managerEval = managerEvalMap.get(
                `${assignment.collaboratorId}-${assignment.cycleId}`,
            );
            let managerEvalScore: number | null = null;
            if (managerEval && managerEval.criterias.length > 0) {
                const sum = managerEval.criterias.reduce((acc, c) => acc + c.score, 0);
                managerEvalScore = sum / managerEval.criterias.length;
            }

            const status = managerEvalScore === null ? 'pendente' : 'finalizado';

            result.push({
                collaborator: {
                    id: assignment.collaborator.id,
                    name: assignment.collaborator.name,
                    email: assignment.collaborator.email,
                    position: assignment.collaborator.position,
                    track: assignment.collaborator.track,
                },
                cycle: {
                    id: assignment.cycle.id,
                    name: assignment.cycle.name,
                },
                autoEvaluationScore: autoEvalScore,
                leaderEvaluationScore: leaderEvalScore,
                managerEvaluationScore: managerEvalScore,
                status,
            });
        }

        return result;
    }

    async getBrutalfacts(leaderId: number) {
        // Buscar todos os assignments do líder
        const assignments = await this.prisma.leaderEvaluationAssignment.findMany({
            where: { leaderId },
        });

        if (assignments.length === 0) {
            return {
                totalLideradosAvaliados: 0,
                mediaGeralPosEqualizacao: null,
                melhoriaCicloAnterior: null,
            };
        }

        // Buscar avaliações já feitas pelo líder
        const evaluations = await this.prisma.leaderEvaluation.findMany({
            where: { leaderId },
        });

        // Total de liderados avaliados
        const totalLideradosAvaliados = evaluations.length;

        // Calcular média geral (por enquanto sem equalização)
        let mediaGeralPosEqualizacao: number | null = null;
        if (evaluations.length > 0) {
            const totalScore = evaluations.reduce((sum, e) => sum + (e.score || 0), 0);
            mediaGeralPosEqualizacao = totalScore / evaluations.length;
        }

        // Calcular melhoria em relação ao ciclo anterior
        let melhoriaCicloAnterior: number | null = null;
        if (evaluations.length >= 2) {
            // Ordenar avaliações por data de criação (mais recente primeiro)
            const sortedEvaluations = evaluations.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );

            // Pegar o ciclo mais recente e o anterior
            const currentCycle = sortedEvaluations[0].cycleId;
            const previousCycle = sortedEvaluations.find((e) => e.cycleId !== currentCycle);

            if (previousCycle) {
                const currentCycleEvaluations = evaluations.filter(
                    (e) => e.cycleId === currentCycle,
                );
                const previousCycleEvaluations = evaluations.filter(
                    (e) => e.cycleId === previousCycle.cycleId,
                );

                const currentAverage =
                    currentCycleEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) /
                    currentCycleEvaluations.length;
                const previousAverage =
                    previousCycleEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) /
                    previousCycleEvaluations.length;

                melhoriaCicloAnterior = currentAverage - previousAverage;
            }
        }

        return {
            totalLideradosAvaliados,
            mediaGeralPosEqualizacao,
            melhoriaCicloAnterior,
        };
    }
}
