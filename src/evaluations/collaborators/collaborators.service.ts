import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollaboratorsService {
    constructor(private readonly prisma: PrismaService) {}

    async getCollaborators() {
        const collaborators = await this.prisma.user.findMany({
            include: {
                track: true,
                evaluator: {
                    include: {
                        autoEvaluation: {
                            include: { assignments: true },
                        },
                        evaluation360: true,
                        mentoring: true,
                        equalization: true, // Inclui a relação com o modelo Equalization
                    },
                },
            },
        });

        return collaborators.map((collaborator) => ({
            id: collaborator.id,
            name: collaborator.name,
            email: collaborator.email,
            position: collaborator.position,
            track: collaborator.track?.name || 'Não informado',
            evaluations: collaborator.evaluator.map((evaluation) => {
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
                        ? evaluation.evaluation360.reduce(
                              (sum, eval360) => sum + eval360.score,
                              0,
                          ) / evaluation.evaluation360.length
                        : 0;

                const finalEqualizationScore =
                    evaluation.equalization?.length > 0
                        ? evaluation.equalization.reduce((sum, eq) => sum + eq.score, 0) / evaluation.equalization.length
                        : 0; // Obtém a nota média do comitê de equalização

                return {
                    cycleId: evaluation.cycleConfigId,
                    autoEvaluationScore,
                    evaluation360Score,
                    mentoringScore: evaluation.mentoring?.score || 0,
                    finalEqualizationScore,
                };
            }),
        }));
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
                equalization: true, // Inclui a relação com o modelo Equalization
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

            const finalEqualizationScore =
                evaluation.equalization?.length > 0
                    ? evaluation.equalization.reduce((sum, eq) => sum + eq.score, 0) / evaluation.equalization.length
                    : 0; // Obtém a nota média do comitê de equalização

            return {
                cycleName: evaluation.cycleConfig.name,
                autoEvaluationScore,
                evaluation360Score,
                mentoringScore: evaluation.mentoring?.score || 0,
                finalEqualizationScore,
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
                equalization: true, // Inclui a relação com o modelo Equalization
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

            const finalEqualizationScore =
                evaluation.equalization?.length > 0
                    ? evaluation.equalization.reduce((sum, eq) => sum + eq.score, 0) / evaluation.equalization.length
                    : 0; // Obtém a nota média do comitê de equalização

            return {
                id: evaluation.id,
                cycleName: evaluation.cycleConfig.name,
                autoEvaluationScore,
                evaluation360Score,
                mentoringScore: evaluation.mentoring?.score || 0,
                finalEqualizationScore,
                reference: evaluation.reference?.map((ref) => ({
                    justification: ref.justification,
                })),
            };
        });
    }
}
