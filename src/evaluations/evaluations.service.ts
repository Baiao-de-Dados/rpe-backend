import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';

@Injectable()
export class EvaluationsService {
    constructor(private prisma: PrismaService) {}

    async createEvaluation(createEvaluationDto: CreateEvaluationDto) {
        const { ciclo, colaboradorId, autoavaliacao, avaliacao360, mentoring, referencias } =
            createEvaluationDto;

        // VALIDAÇÕES PRÉVIAS - Verificar se tudo existe antes de criar
        await this.validateEvaluationData(createEvaluationDto);

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

            // Cria a autoavaliação
            await prisma.autoEvaluation.create({
                data: {
                    evaluationId: evaluation.id,
                    justification: autoavaliacao.justificativa,
                    criteriaAssignments: {
                        create: autoavaliacao.pilares.flatMap((pilar) =>
                            pilar.criterios.map((criterio) => ({
                                criterion: { connect: { id: criterio.criterioId } },
                                note: criterio.nota,
                                justification: criterio.justificativa,
                            })),
                        ),
                    },
                },
            });

            // Cria as avaliações 360
            await Promise.all(
                avaliacao360.map((avaliacao) =>
                    prisma.evaluation360.create({
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
                    prisma.mentoring.create({
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
                    prisma.reference.create({
                        data: {
                            evaluationId: evaluation.id,
                            evaluatorId: colaboradorId,
                            evaluatedId: referencia.colaboradorId,
                            justification: referencia.justificativa,
                            cycle: new Date(),
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
            return prisma.evaluation.findUnique({
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
        });
    }

    /**
     * Valida todos os dados antes de criar a avaliação
     */
    private async validateEvaluationData(data: CreateEvaluationDto) {
        const { ciclo, colaboradorId, autoavaliacao, avaliacao360, mentoring, referencias } = data;

        //Verificar se o colaborador existe
        const colaborador = await this.prisma.user.findUnique({
            where: { id: colaboradorId },
        });
        if (!colaborador) {
            throw new NotFoundException(`Colaborador com ID ${colaboradorId} não encontrado`);
        }

        // Verificar se já existe uma avaliação para este colaborador neste ciclo
        const existingEvaluation = await this.prisma.evaluation.findFirst({
            where: {
                userId: colaboradorId,
                cycle: ciclo,
            },
        });
        if (existingEvaluation) {
            throw new ConflictException(
                `Já existe uma avaliação para o colaborador ${colaboradorId} no ciclo ${ciclo}`,
            );
        }

        //Verificar se todos os critérios existem
        const criterioIds = autoavaliacao.pilares.flatMap((pilar) =>
            pilar.criterios.map((criterio) => criterio.criterioId),
        );
        const criteriosExistentes = await this.prisma.criterion.findMany({
            where: { id: { in: criterioIds } },
        });
        if (criteriosExistentes.length !== criterioIds.length) {
            const idsExistentes = criteriosExistentes.map((c) => c.id);
            const idsNaoExistentes = criterioIds.filter((id) => !idsExistentes.includes(id));
            throw new NotFoundException(
                `Critérios não encontrados: ${idsNaoExistentes.join(', ')}`,
            );
        }

        //Verificar se todos os avaliados da avaliação360 existem
        const avaliadoIds = avaliacao360.map((av) => av.avaliadoId);
        const avaliadosExistentes = await this.prisma.user.findMany({
            where: { id: { in: avaliadoIds } },
        });
        if (avaliadosExistentes.length !== avaliadoIds.length) {
            const idsExistentes = avaliadosExistentes.map((u) => u.id);
            const idsNaoExistentes = avaliadoIds.filter((id) => !idsExistentes.includes(id));
            throw new NotFoundException(
                `Avaliados não encontrados: ${idsNaoExistentes.join(', ')}`,
            );
        }

        // Verificar se todos os mentores existem
        const mentorIds = mentoring.map((m) => m.mentorId);
        const mentoresExistentes = await this.prisma.user.findMany({
            where: { id: { in: mentorIds } },
        });
        if (mentoresExistentes.length !== mentorIds.length) {
            const idsExistentes = mentoresExistentes.map((u) => u.id);
            const idsNaoExistentes = mentorIds.filter((id) => !idsExistentes.includes(id));
            throw new NotFoundException(`Mentores não encontrados: ${idsNaoExistentes.join(', ')}`);
        }

        // Verificar se todos os colaboradores das referências existem
        const referenciaColaboradorIds = referencias.map((r) => r.colaboradorId);
        const referenciaColaboradoresExistentes = await this.prisma.user.findMany({
            where: { id: { in: referenciaColaboradorIds } },
        });
        if (referenciaColaboradoresExistentes.length !== referenciaColaboradorIds.length) {
            const idsExistentes = referenciaColaboradoresExistentes.map((u) => u.id);
            const idsNaoExistentes = referenciaColaboradorIds.filter(
                (id) => !idsExistentes.includes(id),
            );
            throw new NotFoundException(
                `Colaboradores de referência não encontrados: ${idsNaoExistentes.join(', ')}`,
            );
        }

        // Verificar se todas as tags existem
        const tagIds = referencias.flatMap((r) => r.tagIds);
        const tagsExistentes = await this.prisma.tag.findMany({
            where: { id: { in: tagIds } },
        });
        if (tagsExistentes.length !== tagIds.length) {
            const idsExistentes = tagsExistentes.map((t) => t.id);
            const idsNaoExistentes = tagIds.filter((id) => !idsExistentes.includes(id));
            throw new NotFoundException(`Tags não encontradas: ${idsNaoExistentes.join(', ')}`);
        }

        // 8. Verificar se não há duplicatas na avaliação360
        const avaliadoIdsUnicos = new Set(avaliadoIds);
        if (avaliadoIdsUnicos.size !== avaliadoIds.length) {
            throw new BadRequestException(
                'Não é possível avaliar o mesmo colaborador múltiplas vezes na avaliação360',
            );
        }

        // Verificar se não há duplicatas no mentoring
        const mentorIdsUnicos = new Set(mentorIds);
        if (mentorIdsUnicos.size !== mentorIds.length) {
            throw new BadRequestException('Não é possível ter o mesmo mentor múltiplas vezes');
        }

        // Verificar se não há duplicatas nas referências
        const referenciaColaboradorIdsUnicos = new Set(referenciaColaboradorIds);
        if (referenciaColaboradorIdsUnicos.size !== referenciaColaboradorIds.length) {
            throw new BadRequestException(
                'Não é possível referenciar o mesmo colaborador múltiplas vezes',
            );
        }

        // Verificar se o colaborador não está se auto-avaliando na avaliação360
        if (avaliadoIds.includes(colaboradorId)) {
            throw new BadRequestException('O colaborador não pode se auto-avaliar na avaliação360');
        }

        // Verificar se o colaborador não está se auto-mentorando
        if (mentorIds.includes(colaboradorId)) {
            throw new BadRequestException('O colaborador não pode ser seu próprio mentor');
        }

        // Verificar se o colaborador não está se auto-referenciando
        if (referenciaColaboradorIds.includes(colaboradorId)) {
            throw new BadRequestException('O colaborador não pode se auto-referenciar');
        }

        console.log('Todas as validações passaram com sucesso');
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
