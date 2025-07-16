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
        const existing = await this.prisma.leaderEvaluation.findFirst({
            where: {
                cycleId,
                collaboratorId,
                leaderId,
            },
        });

        if (existing) {
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

        const evaluations = await this.prisma.leaderEvaluation.findMany({
            where: { leaderId },
        });

        const averageScoreGiven =
            evaluations.length > 0
                ? evaluations.reduce((sum, e) => sum + (e.score || 0), 0) / evaluations.length
                : null;

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

        // Buscar avaliações dos colaboradores
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: { in: collaboratorIds },
                cycleConfigId: { in: cycleIds },
            },
            include: {
                autoEvaluation: {
                    include: { assignments: true },
                },
                evaluation360: true,
                mentoring: true,
                reference: true,
                evaluator: true,
            },
        });

        const autoEvalMap = new Map();
        for (const ev of evaluations) {
            if (ev.autoEvaluation) {
                // Só pega a mais recente por ciclo
                const key = `${ev.evaluatorId}-${ev.cycleConfigId}`;
                if (!autoEvalMap.has(key) || autoEvalMap.get(key).createdAt < ev.createdAt) {
                    autoEvalMap.set(key, ev);
                }
            }
        }
        const eval360Map = new Map();
        for (const ev of evaluations) {
            if (ev.evaluation360) {
                // Só pega a mais recente por ciclo
                const key = `${ev.evaluatorId}-${ev.cycleConfigId}`;
                if (!eval360Map.has(key) || eval360Map.get(key).createdAt < ev.createdAt) {
                    eval360Map.set(key, ev);
                }
            }
        }

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

            const eval360 = eval360Map.get(`${assignment.collaboratorId}-${assignment.cycleId}`);
            const eval360Score: number | null = eval360?.evaluation360?.score || null;

            const managerEval = managerEvalMap.get(
                `${assignment.collaboratorId}-${assignment.cycleId}`,
            );
            let managerEvalScore: number | null = null;
            if (managerEval && managerEval.criterias.length > 0) {
                const sum = managerEval.criterias.reduce((acc, c) => acc + c.score, 0);
                managerEvalScore = sum / managerEval.criterias.length;
            }

            const leaderEvaluation = await this.prisma.leaderEvaluation.findFirst({
                where: {
                    collaboratorId: assignment.collaboratorId,
                    cycleId: assignment.cycleId,
                    leaderId: leaderId,
                },
            });
            const leaderEvaluationScore: number | null = leaderEvaluation?.score ?? null;

            const finalEvaluationScore: number | null = null;

            const hasAutoEvaluation = autoEvalScore !== null;
            const hasEvaluation360 = eval360Score !== null;
            const hasManagerEvaluation = managerEvalScore !== null;

            const status =
                hasAutoEvaluation && hasEvaluation360 && hasManagerEvaluation
                    ? 'finalizado'
                    : 'pendente';

            result.push({
                collaborator: {
                    id: assignment.collaborator.id,
                    name: assignment.collaborator.name,
                    email: assignment.collaborator.email,
                    position: assignment.collaborator.position,
                    track: assignment.collaborator.track,
                },
                autoEvaluationScore: autoEvalScore,
                evaluation360Score: eval360Score,
                managerEvaluationScore: managerEvalScore,
                leaderEvaluationScore: leaderEvaluationScore,
                finalEvaluationScore: finalEvaluationScore,
                status,
            });
        }

        return result;
    }

    async getBrutalfacts(leaderId: number) {
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

        const evaluations = await this.prisma.leaderEvaluation.findMany({
            where: { leaderId },
        });

        const totalLideradosAvaliados = evaluations.length;

        let mediaGeralPosEqualizacao: number | null = null;
        if (evaluations.length > 0) {
            const totalScore = evaluations.reduce((sum, e) => sum + (e.score || 0), 0);
            mediaGeralPosEqualizacao = totalScore / evaluations.length;
        }

        let melhoriaCicloAnterior: number | null = null;
        if (evaluations.length >= 2) {
            const sortedEvaluations = evaluations.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );

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

    async getAverageEqualizationByCycle(leaderId: number) {
        // Buscar todos os assignments do líder
        const assignments = await this.prisma.leaderEvaluationAssignment.findMany({
            where: { leaderId },
            include: { cycle: true },
        });
        // Agrupar assignments por ciclo
        const assignmentsByCycle = new Map<
            number,
            { cycleName: string; collaboratorIds: number[] }
        >();
        for (const a of assignments) {
            if (!assignmentsByCycle.has(a.cycleId)) {
                assignmentsByCycle.set(a.cycleId, { cycleName: a.cycle.name, collaboratorIds: [] });
            }
            assignmentsByCycle.get(a.cycleId)!.collaboratorIds.push(a.collaboratorId);
        }
        const result: Array<{
            cycleId: number;
            cycleName: string;
            averageEqualizationScore: number | null;
        }> = [];
        for (const [cycleId, { cycleName, collaboratorIds }] of assignmentsByCycle.entries()) {
            if (collaboratorIds.length === 0) {
                result.push({ cycleId, cycleName, averageEqualizationScore: null });
                continue;
            }
            // Buscar equalizações dos colaboradores desse ciclo
            const equalizations = await this.prisma.equalization.findMany({
                where: {
                    cycleId,
                    collaboratorId: { in: collaboratorIds },
                },
            });
            const scores = equalizations
                .map((eq) => eq.score)
                .filter((s) => s !== null && s !== undefined);
            const averageEqualizationScore =
                scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;
            result.push({ cycleId, cycleName, averageEqualizationScore });
        }
        // Ordenar por ciclo (opcional)
        result.sort((a, b) => a.cycleId - b.cycleId);
        return result;
    }

    async getEvaluation(cycleId: number, collaboratorId: number, leaderId: number) {
        return this.prisma.leaderEvaluation.findFirst({
            where: {
                cycleId,
                collaboratorId,
                leaderId,
            },
        });
    }
}
