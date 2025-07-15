import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollaboratorsService {
    constructor(private readonly prisma: PrismaService) {}

    async getCollaborators() {
        const collaborators = await this.prisma.user.findMany({
            include: {
                track: true,
                userRoles: true,
            },
        });

        // Filtrar apenas EMPLOYER
        const onlyEmployers = collaborators.filter((user) =>
            user.userRoles.some((role) => role.role === 'EMPLOYER' && role.isActive),
        );

        const cycles = await this.prisma.cycleConfig.findMany({ orderBy: { startDate: 'asc' } });

        const results = await Promise.all(
            onlyEmployers.map(async (collaborator) => {
                const scores: Array<{
                    cycleId: number;
                    cycleName: string;
                    av360Score: number | null;
                    autoEvaluationScore: number | null;
                    managerScore: number | null;
                    equalizationScore: number | null;
                }> = [];
                for (const cycle of cycles) {
                    const av360 = await this.prisma.evaluation360.findMany({
                        where: {
                            evaluatedId: collaborator.id,
                            evaluation: { cycleConfigId: cycle.id },
                        },
                    });
                    const av360Score =
                        av360.length > 0
                            ? av360.reduce((sum, e) => sum + e.score, 0) / av360.length
                            : null;

                    const autoEval = await this.prisma.evaluation.findFirst({
                        where: {
                            evaluatorId: collaborator.id,
                            cycleConfigId: cycle.id,
                            autoEvaluation: { isNot: null },
                        },
                        include: { autoEvaluation: true },
                    });
                    const autoEvaluationScore = autoEval?.autoEvaluation?.rating ?? null;

                    const managerEval = await this.prisma.managerEvaluation.findFirst({
                        where: {
                            collaboratorId: collaborator.id,
                            cycleId: cycle.id,
                        },
                        include: { criterias: true },
                    });
                    let managerScore: number | null = null;
                    if (managerEval && managerEval.criterias.length > 0) {
                        managerScore =
                            managerEval.criterias.reduce((sum, c) => sum + c.score, 0) /
                            managerEval.criterias.length;
                    }

                    let equalizationScore: number | null = null;
                    if (autoEval) {
                        const equalization = await this.prisma.equalization.findFirst({
                            where: { evaluationId: autoEval.id },
                        });
                        if (equalization) {
                            equalizationScore = equalization.score;
                        }
                    }

                    scores.push({
                        cycleId: cycle.id,
                        cycleName: cycle.name,
                        av360Score,
                        autoEvaluationScore,
                        managerScore,
                        equalizationScore,
                    });
                }
                return {
                    id: collaborator.id,
                    name: collaborator.name,
                    email: collaborator.email,
                    position: collaborator.position,
                    track: collaborator.track?.name || 'Não informado',
                    scores,
                };
            }),
        );
        return results;
    }

    async getCollaboratorEvaluations(collaboratorId: number) {
        const cycles = await this.prisma.cycleConfig.findMany({ orderBy: { startDate: 'asc' } });
        const result: Array<{
            cycleId: number;
            cycleName: string;
            av360Score: number | null;
            autoEvaluationScore: number | null;
            managerScore: number | null;
            equalizationScore: number | null;
        }> = [];
        for (const cycle of cycles) {
            const av360 = await this.prisma.evaluation360.findMany({
                where: {
                    evaluatedId: collaboratorId,
                    evaluation: { cycleConfigId: cycle.id },
                },
            });
            const av360Score =
                av360.length > 0 ? av360.reduce((sum, e) => sum + e.score, 0) / av360.length : null;

            const autoEval = await this.prisma.evaluation.findFirst({
                where: {
                    evaluatorId: collaboratorId,
                    cycleConfigId: cycle.id,
                    autoEvaluation: { isNot: null },
                },
                include: { autoEvaluation: true },
            });
            const autoEvaluationScore = autoEval?.autoEvaluation?.rating ?? null;

            const managerEval = await this.prisma.managerEvaluation.findFirst({
                where: {
                    collaboratorId: collaboratorId,
                    cycleId: cycle.id,
                },
                include: { criterias: true },
            });
            let managerScore: number | null = null;
            if (managerEval && managerEval.criterias.length > 0) {
                managerScore =
                    managerEval.criterias.reduce((sum, c) => sum + c.score, 0) /
                    managerEval.criterias.length;
            }

            let equalizationScore: number | null = null;
            if (autoEval) {
                const equalization = await this.prisma.equalization.findFirst({
                    where: { evaluationId: autoEval.id },
                });
                if (equalization) {
                    equalizationScore = equalization.score;
                }
            }
            result.push({
                cycleId: cycle.id,
                cycleName: cycle.name,
                av360Score,
                autoEvaluationScore,
                managerScore,
                equalizationScore,
            });
        }
        return result;
    }

    async getCollaboratorEvaluationHistory(collaboratorId: number) {
        const cycles = await this.prisma.cycleConfig.findMany({ orderBy: { startDate: 'asc' } });
        const result: Array<{
            cycleId: number;
            cycleName: string;
            av360Score: number | null;
            autoEvaluationScore: number | null;
            managerScore: number | null;
            equalizationScore: number | null;
        }> = [];
        for (const cycle of cycles) {
            const av360 = await this.prisma.evaluation360.findMany({
                where: {
                    evaluatedId: collaboratorId,
                    evaluation: { cycleConfigId: cycle.id },
                },
            });
            const av360Score =
                av360.length > 0 ? av360.reduce((sum, e) => sum + e.score, 0) / av360.length : null;

            const autoEval = await this.prisma.evaluation.findFirst({
                where: {
                    evaluatorId: collaboratorId,
                    cycleConfigId: cycle.id,
                    autoEvaluation: { isNot: null },
                },
                include: { autoEvaluation: true },
            });
            const autoEvaluationScore = autoEval?.autoEvaluation?.rating ?? null;

            const managerEval = await this.prisma.managerEvaluation.findFirst({
                where: {
                    collaboratorId: collaboratorId,
                    cycleId: cycle.id,
                },
                include: { criterias: true },
            });
            let managerScore: number | null = null;
            if (managerEval && managerEval.criterias.length > 0) {
                managerScore =
                    managerEval.criterias.reduce((sum, c) => sum + c.score, 0) /
                    managerEval.criterias.length;
            }

            let equalizationScore: number | null = null;
            if (autoEval) {
                const equalization = await this.prisma.equalization.findFirst({
                    where: { evaluationId: autoEval.id },
                });
                if (equalization) {
                    equalizationScore = equalization.score;
                }
            }

            result.push({
                cycleId: cycle.id,
                cycleName: cycle.name,
                av360Score,
                autoEvaluationScore,
                managerScore,
                equalizationScore,
            });
        }
        return result;
    }

    /**
     * Retorna as principais notas recebidas pelo colaborador agrupadas por ciclo
     */
    async getCollaboratorScores(collaboratorId: number) {
        // Buscar todos os ciclos em que o colaborador participou
        const cycles = await this.prisma.cycleConfig.findMany({
            orderBy: { startDate: 'asc' },
        });
        const result: Array<{
            cycleId: number;
            cycleName: string;
            av360Score: number | null;
            autoEvaluationScore: number | null;
            managerScore: number | null;
            equalizationScore: number | null;
        }> = [];
        for (const cycle of cycles) {
            // AV360 recebida
            const av360 = await this.prisma.evaluation360.findMany({
                where: {
                    evaluatedId: collaboratorId,
                    evaluation: { cycleConfigId: cycle.id },
                },
            });
            const av360Score =
                av360.length > 0 ? av360.reduce((sum, e) => sum + e.score, 0) / av360.length : null;

            // Autoavaliação
            const autoEval = await this.prisma.evaluation.findFirst({
                where: {
                    evaluatorId: collaboratorId,
                    cycleConfigId: cycle.id,
                    autoEvaluation: { isNot: null },
                },
                include: { autoEvaluation: true },
            });
            const autoEvaluationScore = autoEval?.autoEvaluation?.rating ?? null;

            // Nota do gestor
            const managerEval = await this.prisma.managerEvaluation.findFirst({
                where: {
                    collaboratorId: collaboratorId,
                    cycleId: cycle.id,
                },
                include: { criterias: true },
            });
            let managerScore: number | null = null;
            if (managerEval && managerEval.criterias.length > 0) {
                managerScore =
                    managerEval.criterias.reduce((sum, c) => sum + c.score, 0) /
                    managerEval.criterias.length;
            }

            // Nota da equalização (única)
            let equalizationScore: number | null = null;
            if (autoEval) {
                const equalization = await this.prisma.equalization.findFirst({
                    where: { evaluationId: autoEval.id },
                });
                if (equalization) {
                    equalizationScore = equalization.score;
                }
            }

            result.push({
                cycleId: cycle.id,
                cycleName: cycle.name,
                av360Score,
                autoEvaluationScore,
                managerScore,
                equalizationScore,
            });
        }
        return result;
    }
}
