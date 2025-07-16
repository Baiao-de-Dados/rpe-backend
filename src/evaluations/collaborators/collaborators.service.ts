import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CollaboratorScore = {
    cycleId: number;
    cycleName: string;
    av360Score: number | null;
    autoEvaluationScore: number | null;
    managerScore: number | null;
    equalizationScore: number | null;
};

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
                const scores: CollaboratorScore[] = [];
                for (const cycle of cycles) {
                    // Buscar todos os Evaluation do ciclo
                    const evaluations = await this.prisma.evaluation.findMany({
                        where: {
                            cycleConfigId: cycle.id,
                        },
                        select: { id: true },
                    });
                    const evaluationIds = evaluations.map((e) => e.id);

                    // AV360 recebida
                    const av360 = await this.prisma.evaluation360.findMany({
                        where: {
                            evaluatedId: collaborator.id,
                            evaluationId: { in: evaluationIds },
                        },
                    });
                    const av360Score = av360.length
                        ? av360.reduce((sum, a) => sum + (a.score ?? 0), 0) / av360.length
                        : null;

                    // Autoavaliação
                    const autoEval = await this.prisma.evaluation.findFirst({
                        where: {
                            evaluatorId: collaborator.id,
                            cycleConfigId: cycle.id,
                        },
                        include: { autoEvaluation: true },
                    });
                    const autoEvaluationScore = autoEval?.autoEvaluation?.rating ?? null;

                    // Manager
                    const managerEval = await this.prisma.managerEvaluation.findFirst({
                        where: {
                            collaboratorId: collaborator.id,
                            cycleId: cycle.id,
                        },
                        include: { criterias: true },
                    });
                    const managerScore = managerEval?.criterias?.length
                        ? managerEval.criterias.reduce((sum, a) => sum + (a.score ?? 0), 0) /
                          managerEval.criterias.length
                        : null;

                    // Equalização
                    const equalization = await this.prisma.equalization.findFirst({
                        where: {
                            collaboratorId: collaborator.id,
                            cycleId: cycle.id,
                        },
                    });
                    const equalizationScore = equalization?.score ?? null;

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
                    track: collaborator.track?.name || null,
                    scores,
                };
            }),
        );
        return results;
    }

    async getCollaboratorEvaluations(collaboratorId: number) {
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: collaboratorId,
            },
            include: {
                autoEvaluation: {
                    include: { assignments: true },
                },
                evaluation360: true,
                mentoring: true,
                cycleConfig: true,
            },
        });

        if (evaluations.length === 0) {
            throw new NotFoundException('Nenhuma avaliação encontrada para este colaborador');
        }

        return evaluations.map((evaluation) => {
            const autoEvaluationScore =
                evaluation.autoEvaluation?.assignments &&
                evaluation.autoEvaluation.assignments.length > 0
                    ? evaluation.autoEvaluation.assignments.reduce(
                          (sum, assignment) => sum + assignment.score,
                          0,
                      ) / evaluation.autoEvaluation.assignments.length
                    : 0;

            const evaluation360Score =
                evaluation.evaluation360?.length > 0
                    ? evaluation.evaluation360.reduce((sum, eval360) => sum + eval360.score, 0) /
                      evaluation.evaluation360.length
                    : 0;

            return {
                cycleName: evaluation.cycleConfig.name,
                autoEvaluationScore,
                evaluation360Score,
            };
        });
    }

    async getCollaboratorEvaluationHistory(collaboratorId: number) {
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: collaboratorId,
            },
            include: {
                autoEvaluation: {
                    include: { assignments: true },
                },
                evaluation360: true,
                mentoring: true,
                reference: true,
                cycleConfig: true,
            },
        });

        return evaluations.map((evaluation) => {
            const autoEvaluationScore =
                evaluation.autoEvaluation?.assignments &&
                evaluation.autoEvaluation.assignments.length > 0
                    ? evaluation.autoEvaluation.assignments.reduce(
                          (sum, assignment) => sum + assignment.score,
                          0,
                      ) / evaluation.autoEvaluation.assignments.length
                    : 0;

            const evaluation360Score =
                evaluation.evaluation360?.length > 0
                    ? evaluation.evaluation360.reduce((sum, eval360) => sum + eval360.score, 0) /
                      evaluation.evaluation360.length
                    : 0;

            return {
                id: evaluation.id,
                cycleName: evaluation.cycleConfig.name,
                autoEvaluationScore,
                evaluation360Score,
                mentoringScore: evaluation.mentoring?.score || 0,
                // Remover finalEqualizationScore pois evaluation.equalization não existe nesse contexto
                reference: evaluation.reference?.map((ref) => ({
                    justification: ref.justification,
                })),
            };
        });
    }
}
