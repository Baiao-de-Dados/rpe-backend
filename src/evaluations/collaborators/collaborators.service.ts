import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollaboratorsService {
    constructor(private readonly prisma: PrismaService) {}

    async getCollaborators() {
        const collaborators = await this.prisma.user.findMany({
            include: {
                evaluations: {
                    include: {
                        autoEvaluation: {
                            include: { assignments: true },
                        },
                        evaluation360: true,
                        mentoring: true,
                        equalization: true, // Inclui a nota do comitê
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
            evaluations: collaborator.evaluations.map((evaluation) => {
                const autoEvaluationScore =
                    evaluation.autoEvaluation?.assignments.reduce(
                        (sum, assignment) => sum + assignment.score,
                        0,
                    ) / (evaluation.autoEvaluation?.assignments.length || 1);

                const evaluation360Score =
                    evaluation.evaluation360.reduce((sum, eval360) => sum + eval360.score, 0) /
                    (evaluation.evaluation360.length || 1);

                return {
                    cycleId: evaluation.cycleConfigId,
                    autoEvaluationScore: autoEvaluationScore || 0,
                    evaluation360Score: evaluation360Score || 0,
                    mentoringScore: evaluation.mentoring?.score || 0,
                    finalEqualizationScore: evaluation.equalization?.score || 0, // Nota do comitê
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
                equalization: true, // Inclui a nota do comitê
                cycleConfig: true,
            },
        });

        if (evaluations.length === 0) {
            throw new NotFoundException('Nenhuma avaliação encontrada para este colaborador');
        }

        return evaluations.map((evaluation) => {
            const autoEvaluationScore =
                evaluation.autoEvaluation?.assignments.reduce(
                    (sum, assignment) => sum + assignment.score,
                    0,
                ) / (evaluation.autoEvaluation?.assignments.length || 1);

            const evaluation360Score =
                evaluation.evaluation360.reduce((sum, eval360) => sum + eval360.score, 0) /
                (evaluation.evaluation360.length || 1);

            return {
                cycleName: evaluation.cycleConfig.name,
                autoEvaluationScore: autoEvaluationScore || 0,
                evaluation360Score: evaluation360Score || 0,
                mentoringScore: evaluation.mentoring?.score || 0,
                finalEqualizationScore: evaluation.equalization?.score || 0, // Nota do comitê
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
                equalization: true, // Inclui a nota do comitê
                cycleConfig: true,
            },
        });

        return evaluations.map((evaluation) => {
            const autoEvaluationScore =
                evaluation.autoEvaluation?.assignments.reduce(
                    (sum, assignment) => sum + assignment.score,
                    0,
                ) / (evaluation.autoEvaluation?.assignments.length || 1);

            const evaluation360Score =
                evaluation.evaluation360.reduce((sum, eval360) => sum + eval360.score, 0) /
                (evaluation.evaluation360.length || 1);

            return {
                id: evaluation.id,
                cycleName: evaluation.cycleConfig.name,
                autoEvaluationScore: autoEvaluationScore || 0,
                evaluation360Score: evaluation360Score || 0,
                mentoringScore: evaluation.mentoring?.score || 0,
                finalEqualizationScore: evaluation.equalization?.score || 0, // Nota do comitê
                reference: evaluation.reference?.map((ref) => ({
                    justification: ref.justification,
                })),
            };
        });
    }
}
