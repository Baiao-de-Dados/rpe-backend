import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';

@Injectable()
export class EvaluationsService {
    constructor(private prisma: PrismaService) {}

    async createEvaluation(createEvaluationDto: CreateEvaluationDto) {
        const { ciclo, colaboradorId, autoavaliacao, avaliacao360, mentoring, referencias } =
            createEvaluationDto;

        // Cria a avaliação principal
        const evaluation = await this.prisma.evaluation.create({
            data: {
                cycle: ciclo,
                userId: colaboradorId,
                grade: 0, // ou null, se permitido, ou algum valor default
            },
        });

        // Cria a autoavaliação
        await this.prisma.autoEvaluation.create({
            data: {
                evaluationId: evaluation.id,
                justification: autoavaliacao.justificativa,
                criteriaAssignments: {
                    create: autoavaliacao.pilares.flatMap((pilar) =>
                        pilar.criterios.map((criterio) => ({
                            criterion: { connect: { id: criterio.criterioId } },
                            nota: criterio.nota,
                            justificativa: criterio.justificativa,
                        })),
                    ),
                },
            },
        });

        // Cria as avaliações 360
        await Promise.all(
            avaliacao360.map((avaliacao) =>
                this.prisma.evaluation360.create({
                    data: {
                        evaluationId: evaluation.id,
                        evaluatorId: colaboradorId,
                        evaluatedId: avaliacao.avaliadoId,
                        strengths: avaliacao.pontosFortes || '',
                        improvements: avaliacao.pontosMelhoria || '',
                    },
                }),
            ),
        );

        // Cria as mentorias
        await Promise.all(
            mentoring.map((mentor) =>
                this.prisma.mentoring.create({
                    data: {
                        evaluationId: evaluation.id,
                        evaluatorId: mentor.mentorId,
                        evaluatedId: colaboradorId,
                        justification: mentor.justificativa,
                        cycle: ciclo,
                    },
                }),
            ),
        );

        // Cria as referências
        await Promise.all(
            referencias.map((referencia) =>
                this.prisma.reference.create({
                    data: {
                        evaluationId: evaluation.id,
                        evaluatorId: colaboradorId,
                        evaluatedId: referencia.colaboradorId,
                        justification: referencia.justificativa,
                        cycle: new Date(ciclo),
                        tagReferences: {
                            create: referencia.tagIds.map((tagId) => ({
                                tag: { connect: { id: tagId } },
                            })),
                        },
                    },
                }),
            ),
        );

        // Retorna tudo junto
        return this.prisma.evaluation.findUnique({
            where: { id: evaluation.id },
            include: {
                autoEvaluation: {
                    include: {
                        criteriaAssignments: {
                            include: {
                                criterion: {
                                    include: {
                                        pillar: true,
                                    },
                                },
                            },
                        },
                    },
                },
                evaluation360: true,
                mentoring: true,
                references: {
                    include: {
                        tagReferences: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findAll() {
        return this.prisma.evaluation.findMany({
            include: {
                user: true,
                autoEvaluation: {
                    include: {
                        criteriaAssignments: {
                            include: {
                                criterion: {
                                    include: {
                                        pillar: true,
                                    },
                                },
                            },
                        },
                    },
                },
                evaluation360: true,
                mentoring: true,
                references: {
                    include: {
                        tagReferences: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id },
            include: {
                user: true,
                autoEvaluation: {
                    include: {
                        criteriaAssignments: {
                            include: {
                                criterion: {
                                    include: {
                                        pillar: true,
                                    },
                                },
                            },
                        },
                    },
                },
                evaluation360: true,
                mentoring: true,
                references: {
                    include: {
                        tagReferences: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
            },
        });

        if (!evaluation) {
            throw new NotFoundException(`Avaliação com ID ${id} não encontrada`);
        }

        return evaluation;
    }
}
