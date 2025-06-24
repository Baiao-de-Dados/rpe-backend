import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { Evaluation360Service } from './services/evaluation360.service';
import { MentoringService } from './services/mentoring.service';
import { ReferenceService } from './services/reference.service';

@Injectable()
export class EvaluationsService {
    constructor(
        private prisma: PrismaService,
        private validationService: EvaluationValidationService,
        private autoEvaluationService: AutoEvaluationService,
        private evaluation360Service: Evaluation360Service,
        private mentoringService: MentoringService,
        private referenceService: ReferenceService,
    ) {}

    async createEvaluation(createEvaluationDto: CreateEvaluationDto) {
        const { ciclo, colaboradorId, autoavaliacao, avaliacao360, mentoring, referencias } =
            createEvaluationDto;

        // VALIDAÇÕES PRÉVIAS - Usando o service de validação
        await this.validationService.validateEvaluationData(createEvaluationDto);

        // Usar transação para garantir atomicidade
        return await this.prisma.$transaction(async (prisma) => {
            // Cria a avaliação principal
            const evaluation = await prisma.evaluation.create({
                data: {
                    cycle: ciclo,
                    userId: colaboradorId,
                    grade: 0.0,
                },
            });

            // Cria a autoavaliação usando o service específico (só se houver dados)
            if (autoavaliacao && autoavaliacao.pilares && autoavaliacao.pilares.length > 0) {
                await this.autoEvaluationService.createAutoEvaluation(
                    evaluation.id,
                    autoavaliacao,
                    prisma,
                );
            }

            // Cria as avaliações 360 usando o service específico (só se houver dados)
            if (avaliacao360 && avaliacao360.length > 0) {
                await this.evaluation360Service.createEvaluation360(
                    evaluation.id,
                    colaboradorId,
                    avaliacao360,
                    prisma,
                );
            }

            // Cria as mentorias usando o service específico (só se houver dados)
            if (mentoring) {
                await this.mentoringService.createMentoring(
                    evaluation.id,
                    colaboradorId,
                    ciclo,
                    mentoring,
                    prisma,
                );
            }

            // Cria as referências usando o service específico (só se houver dados)
            if (referencias && referencias.length > 0) {
                await this.referenceService.createReferences(
                    evaluation.id,
                    colaboradorId,
                    referencias,
                    prisma,
                );
            }
            // Retorna tudo junto
            return this.getEvaluationWithAllData(evaluation.id);
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
        const evaluation = await this.getEvaluationWithAllData(id);

        if (!evaluation) {
            throw new NotFoundException(`Avaliação com ID ${id} não encontrada`);
        }

        return evaluation;
    }

    private async getEvaluationWithAllData(evaluationId: number) {
        return await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
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
}
