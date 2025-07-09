import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollaboratorsService {
    constructor(private readonly prisma: PrismaService) {}

    async getCollaboratorsScores() {
        const collaborators = await this.prisma.user.findMany({
            include: {
                track: true,
                evaluator: {
                    where: { status: 'COMPLETED' },
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
}
