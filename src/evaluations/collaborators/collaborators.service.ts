import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollaboratorsService {
    constructor(private readonly prisma: PrismaService) {}

    async getCollaboratorsScores(cycleId?: number) {
        const collaborators = await this.prisma.user.findMany({
            include: {
                track: true,
                evaluator: {
                    where: {
                        status: 'COMPLETED',
                        ...(cycleId ? { cycleConfigId: cycleId } : {}), // Filtra pelo ciclo, se fornecido
                    },
                    include: {
                        autoEvaluation: {
                            include: {
                                assignments: {
                                    include: {
                                        criterion: true, // Inclui os critérios avaliados
                                    },
                                },
                            },
                        },
                        evaluation360: true,
                        mentoring: true,
                        reference: true,
                    },
                },
            },
        });

        return collaborators.map((collaborator) => {
            const evaluations = collaborator.evaluator.map((evaluation) => {
                const autoEvaluationScore =
                    (evaluation.autoEvaluation?.assignments?.reduce((sum, a) => sum + a.score, 0) || 0) /
                    (evaluation.autoEvaluation?.assignments?.length || 1);

                return {
                    cycleId: evaluation.cycleConfigId,
                    track: evaluation.trackId || 'Não informado',
                    autoEvaluationScore,
                    evaluation360Score: evaluation.evaluation360?.score || null,
                    mentoringScore: evaluation.mentoring?.score || null,
                    finalEqualizationScore: evaluation.reference?.justification || null,
                };
            });

            return {
                name: collaborator.name,
                track: collaborator.track?.name || 'Não informado',
                position: collaborator.position,
                evaluations,
            };
        });
    }

    async getCollaboratorEvaluation(cycleId: number, collaboratorId: number, role: 'COMMITTEE' | 'MANAGER') {
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                cycleConfigId: cycleId,
                evaluateeId: collaboratorId,
                status: 'COMPLETED',
            },
            include: {
                autoEvaluation: {
                    include: {
                        assignments: {
                            include: { criterion: true },
                        },
                    },
                },
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
        });

        if (!evaluations.length) {
            throw new NotFoundException('Nenhuma avaliação encontrada para o colaborador no ciclo especificado.');
        }

        const response = {
            selfAssessment: evaluations[0].autoEvaluation
                ? {
                      rating: evaluations[0].autoEvaluation.assignments.reduce((sum, a) => sum + a.score, 0) /
                          evaluations[0].autoEvaluation.assignments.length,
                      pillars: evaluations[0].autoEvaluation.assignments.map((assignment) => ({
                          pillarName: `Pillar ${assignment.criterion.pillarId}`,
                          criteria: [
                              {
                                  criteriaName: assignment.criterion.name,
                                  rating: assignment.score,
                                  justification: assignment.justification,
                              },
                          ],
                      })),
                  }
                : null,
            evaluation360: evaluations[0].evaluation360
                ? {
                      rating: evaluations[0].evaluation360.score,
                      evaluation: [
                          {
                              collaratorName: evaluations[0].evaluatorId ? `Evaluator ${evaluations[0].evaluatorId}` : 'Unknown',
                              collaboratorPosition: evaluations[0].evaluatorId ? 'Position not available' : 'Unknown',
                              rating: evaluations[0].evaluation360.score,
                              improvements: evaluations[0].evaluation360.improvements,
                              strengths: evaluations[0].evaluation360.strengths,
                          },
                      ],
                  }
                : null,
            reference: evaluations[0].reference
                ? [
                      {
                          collaratorName: evaluations[0].evaluatorId ? `Evaluator ${evaluations[0].evaluatorId}` : 'Unknown',
                          collaboratorPosition: evaluations[0].evaluatorId ? 'Position not available' : 'Unknown',
                          justification: evaluations[0].reference.justification,
                      },
                  ]
                : null,
            managerEvaluation: role === 'MANAGER' && evaluations[0].mentoring
                ? {
                      rating: evaluations[0].mentoring.score,
                      pillars: evaluations[0].autoEvaluation?.assignments.map((assignment) => ({
                          pillarName: `Pillar ${assignment.criterion.pillarId}`,
                          criteria: [
                              {
                                  criteriaName: assignment.criterion.name,
                                  rating: assignment.score,
                                  justification: assignment.justification,
                              },
                          ],
                      })),
                  }
                : null,
        };

        return response;
    }

    async getCollaboratorEvaluations(collaboratorId: number) {
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: collaboratorId,
                status: 'COMPLETED',
            },
            include: {
                autoEvaluation: {
                    include: {
                        assignments: {
                            include: { criterion: true },
                        },
                    },
                },
                evaluation360: true,
                mentoring: true,
                reference: true,
                cycleConfig: true,
                evaluatee: {
                    include: { mentor: true }, // Inclui o mentor do avaliado
                },
            },
        });

        if (!evaluations.length) {
            throw new NotFoundException('Nenhuma avaliação encontrada para o colaborador especificado.');
        }

        return evaluations.map((evaluation) => ({
            cycleName: evaluation.cycleConfig.name,
            selfAssessment: evaluation.autoEvaluation
                ? {
                      pillars: evaluation.autoEvaluation.assignments.map((assignment) => ({
                          pillarName: `Pillar ${assignment.criterion.pillarId}`,
                          criteria: [
                              {
                                  criteriaName: assignment.criterion.name,
                                  rating: assignment.score,
                                  weight: 20, // Ajuste conforme necessário
                                  managerRating: 5, // Ajuste conforme necessário
                                  justification: assignment.justification,
                              },
                          ],
                      })),
                  }
                : null,
            evaluation360: evaluation.evaluation360
                ? {
                      evaluation: [
                          {
                              collaratorName: `Evaluator ${evaluation.evaluatorId}`,
                              collaboratorPosition: 'Position not available', // Ajuste conforme necessário
                              rating: evaluation.evaluation360.score,
                              improvements: evaluation.evaluation360.improvements,
                              strengths: evaluation.evaluation360.strengths,
                          },
                      ],
                  }
                : null,
            reference: evaluation.reference
                ? [
                      {
                          collaratorName: `Evaluator ${evaluation.evaluatorId}`,
                          collaboratorPosition: 'Position not available', // Ajuste conforme necessário
                          justification: evaluation.reference.justification,
                      },
                  ]
                : null,
            mentoring: evaluation.mentoring
                ? {
                      rating: evaluation.mentoring.score,
                      justification: evaluation.mentoring.justification,
                      mentorName: evaluation.evaluatee.mentor?.name || 'Mentor não informado',
                  }
                : null,
        }));
    }
}
