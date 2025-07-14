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
                        reference: true,
                        cycleConfig: true,
                    },
                },
            },
        });

        return collaborators.map((collaborator) => {
            const evaluations = collaborator.evaluator.map((evaluation) => {
                return {
                    id: evaluation.id,
                    cycleConfigId: evaluation.cycleConfigId,
                    createdAt: evaluation.createdAt,
                    updatedAt: evaluation.updatedAt,
                    autoEvaluation: evaluation.autoEvaluation,
                    evaluation360: evaluation.evaluation360,
                    mentoring: evaluation.mentoring,
                    reference: evaluation.reference,
                    cycleConfig: evaluation.cycleConfig,
                };
            });

            return {
                id: collaborator.id,
                name: collaborator.name,
                email: collaborator.email,
                position: collaborator.position,
                track: collaborator.track?.name || 'Não informado',
                evaluations,
            };
        });
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
                reference: true,
                cycleConfig: true,
            },
        });

        if (evaluations.length === 0) {
            throw new NotFoundException('Nenhuma avaliação encontrada para este colaborador');
        }

        return {
            collaborator: {
                id: collaboratorId,
            },
            selfAssessment: evaluations[0].autoEvaluation
                ? {
                      rating:
                          evaluations[0].autoEvaluation.assignments.reduce(
                              (sum, a) => sum + a.score,
                              0,
                          ) / evaluations[0].autoEvaluation.assignments.length,
                      pillars: evaluations[0].autoEvaluation.assignments.map((assignment) => ({
                          id: assignment.criterionId,
                          score: assignment.score,
                          justification: assignment.justification,
                      })),
                  }
                : null,
            evaluation360:
                evaluations[0].evaluation360 && evaluations[0].evaluation360.length > 0
                    ? {
                          rating: evaluations[0].evaluation360[0].score,
                          strengths: evaluations[0].evaluation360[0].strengths,
                          improvements: evaluations[0].evaluation360[0].improvements,
                      }
                    : null,
            reference:
                evaluations[0].reference && evaluations[0].reference.length > 0
                    ? {
                          justification: evaluations[0].reference[0].justification,
                      }
                    : null,
            mentoring: evaluations[0].mentoring
                ? {
                      rating: evaluations[0].mentoring.score,
                      pillars: evaluations[0].autoEvaluation?.assignments.map((assignment) => ({
                          id: assignment.criterionId,
                          score: assignment.score,
                          justification: assignment.justification,
                      })),
                  }
                : null,
        };
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
            return {
                id: evaluation.id,
                cycleName: evaluation.cycleConfig.name,
                selfAssessment: evaluation.autoEvaluation
                    ? {
                          rating:
                              evaluation.autoEvaluation.assignments.reduce(
                                  (sum, a) => sum + a.score,
                                  0,
                              ) / evaluation.autoEvaluation.assignments.length,
                          pillars: evaluation.autoEvaluation.assignments.map((assignment) => ({
                              id: assignment.criterionId,
                              score: assignment.score,
                              justification: assignment.justification,
                          })),
                      }
                    : null,
                evaluation360:
                    evaluation.evaluation360 && evaluation.evaluation360.length > 0
                        ? {
                              rating: evaluation.evaluation360[0].score,
                              strengths: evaluation.evaluation360[0].strengths,
                              improvements: evaluation.evaluation360[0].improvements,
                          }
                        : null,
                reference:
                    evaluation.reference && evaluation.reference.length > 0
                        ? {
                              justification: evaluation.reference[0].justification,
                          }
                        : null,
                mentoring: evaluation.mentoring
                    ? {
                          rating: evaluation.mentoring.score,
                          justification: evaluation.mentoring.justification,
                      }
                    : null,
            };
        });
    }
}
