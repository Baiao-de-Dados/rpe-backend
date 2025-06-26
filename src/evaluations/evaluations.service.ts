import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { ReferenceService } from './services/reference.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { MentorEvaluationService } from './services/mentor-evaluation.service';
import { EvaluationType } from '@prisma/client';

@Injectable()
export class EvaluationsService {
    constructor(
        private prisma: PrismaService,
        private validationService: EvaluationValidationService,
        private peer360EvaluationService: Peer360EvaluationService,
        private referenceService: ReferenceService,
        private autoEvaluationService: AutoEvaluationService,
        private mentorEvaluationService: MentorEvaluationService,
    ) {}

    async createEvaluation(createEvaluationDto: CreateEvaluationDto) {
        const { ciclo, colaboradorId, autoavaliacao, avaliacao360, mentoring, referencias } =
            createEvaluationDto;

        // Converter colaboradorId de string para number
        const colaboradorIdNumber = parseInt(colaboradorId, 10);

        // VALIDAÇÕES PRÉVIAS - Usando o service de validação
        await this.validationService.validateEvaluationData(createEvaluationDto);

        // Usar transação para garantir atomicidade
        return await this.prisma.$transaction(async (prisma) => {
            const evaluations: any[] = [];

            // 1. Cria a autoavaliação usando o service
            const autoEvaluation = await this.autoEvaluationService.createAutoEvaluation(
                prisma,
                autoavaliacao,
                colaboradorIdNumber,
                ciclo,
            );
            if (autoEvaluation) {
                evaluations.push(autoEvaluation);
            }

            // 2. Cria as avaliações 360 (PEER_360) usando o service
            const peerEvaluations = await this.peer360EvaluationService.createPeer360Evaluations(
                prisma,
                avaliacao360,
                colaboradorIdNumber,
                ciclo,
            );
            evaluations.push(...peerEvaluations);

            // 3. Cria as avaliações de mentor e líder (MENTOR/LEADER) usando o service
            const mentorAndLeaderEvaluations =
                await this.mentorEvaluationService.createMentorEvaluations(
                    prisma,
                    mentoring,
                    colaboradorIdNumber,
                    ciclo,
                );
            evaluations.push(...mentorAndLeaderEvaluations);

            // 4. Cria as referências usando o service
            await this.referenceService.createReferences(prisma, referencias, colaboradorIdNumber);

            // Retorna a estrutura compatível com o formato anterior
            return this.formatEvaluationResponse(evaluations, colaboradorIdNumber, ciclo);
        });
    }

    async findAll() {
        const evaluations = await this.prisma.evaluation.findMany({
            include: {
                evaluator: true,
                evaluatee: true,
                CriteriaAssignment: {
                    include: {
                        criterion: {
                            include: {
                                pillar: true,
                            },
                        },
                    },
                },
            },
        });

        // Agrupa as avaliações por ciclo e evaluatee
        const groupedEvaluations = this.groupEvaluationsByCycleAndUser(evaluations);
        return groupedEvaluations;
    }

    async findOne(id: number) {
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id },
            include: {
                evaluator: true,
                evaluatee: true,
                CriteriaAssignment: {
                    include: {
                        criterion: {
                            include: {
                                pillar: true,
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

    async findByType(type: string) {
        if (!Object.values(EvaluationType).includes(type as EvaluationType)) {
            throw new BadRequestException(`Tipo de avaliação inválido: ${type}`);
        }
        const evaluations = await this.prisma.evaluation.findMany({
            where: { type: type as EvaluationType },
            include: {
                evaluator: true,
                evaluatee: true,
                CriteriaAssignment: {
                    include: {
                        criterion: {
                            include: {
                                pillar: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return evaluations;
    }

    async findByTypeAndEvaluatee(type: string, evaluateeId: number) {
        if (!Object.values(EvaluationType).includes(type as EvaluationType)) {
            throw new BadRequestException(`Tipo de avaliação inválido: ${type}`);
        }
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                type: type as EvaluationType,
                evaluateeId: evaluateeId,
            },
            include: {
                evaluator: true,
                evaluatee: true,
                CriteriaAssignment: {
                    include: {
                        criterion: {
                            include: {
                                pillar: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return evaluations;
    }

    async findByTypeAndEvaluator(type: string, evaluatorId: number) {
        if (!Object.values(EvaluationType).includes(type as EvaluationType)) {
            throw new BadRequestException(`Tipo de avaliação inválido: ${type}`);
        }
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                type: type as EvaluationType,
                evaluatorId: evaluatorId,
            },
            include: {
                evaluator: true,
                evaluatee: true,
                CriteriaAssignment: {
                    include: {
                        criterion: {
                            include: {
                                pillar: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return evaluations;
    }

    private async formatEvaluationResponse(
        evaluations: any[],
        colaboradorId: number,
        ciclo: string,
    ) {
        // Busca referências relacionadas
        const references = await this.prisma.reference.findMany({
            where: {
                fromId: colaboradorId,
            },
        });

        return {
            id: evaluations[0]?.id || 0,
            cycle: ciclo,
            userId: colaboradorId,
            grade: 0.0,
            user: null, // Será preenchido se necessário
            autoEvaluation: evaluations.find((e) => e.type === 'AUTOEVALUATION')
                ? {
                      id: evaluations.find((e) => e.type === 'AUTOEVALUATION')?.id,
                      evaluationId: evaluations.find((e) => e.type === 'AUTOEVALUATION')?.id,
                      justification: evaluations.find((e) => e.type === 'AUTOEVALUATION')
                          ?.justification,
                      criteriaAssignments: [], // Será preenchido se necessário
                  }
                : null,
            evaluation360: evaluations
                .filter((e) => e.type === 'PEER_360')
                .map((e) => ({
                    id: e.id,
                    evaluationId: e.id,
                    evaluatorId: e.evaluatorId,
                    evaluatedId: e.evaluateeId,
                    strengths: '',
                    improvements: '',
                })),
            leader: evaluations.find((e) => e.type === 'LEADER')
                ? {
                      id: evaluations.find((e) => e.type === 'LEADER')?.id,
                      evaluationId: evaluations.find((e) => e.type === 'LEADER')?.id,
                      evaluatorId: evaluations.find((e) => e.type === 'LEADER')?.evaluatorId,
                      evaluatedId: evaluations.find((e) => e.type === 'LEADER')?.evaluateeId,
                      justification: evaluations.find((e) => e.type === 'LEADER')?.justification,
                      cycle: ciclo,
                  }
                : null,
            mentoring: evaluations.find((e) => e.type === 'MENTOR')
                ? {
                      id: evaluations.find((e) => e.type === 'MENTOR')?.id,
                      evaluationId: evaluations.find((e) => e.type === 'MENTOR')?.id,
                      evaluatorId: evaluations.find((e) => e.type === 'MENTOR')?.evaluatorId,
                      evaluatedId: evaluations.find((e) => e.type === 'MENTOR')?.evaluateeId,
                      justification: evaluations.find((e) => e.type === 'MENTOR')?.justification,
                      cycle: ciclo,
                  }
                : null,
            references: references.map((r) => ({
                id: r.id,
                evaluatorId: r.fromId,
                evaluatedId: r.toId,
                justification: r.comment,
                createdAt: r.createdAt,
                cycle: new Date(),
                tagReferences: r.tags.map((tag) => ({
                    tagId: parseInt(tag),
                    referenceId: r.id,
                    tag: { id: parseInt(tag), name: `Tag ${tag}` }, // Placeholder
                })),
            })),
        };
    }

    private groupEvaluationsByCycleAndUser(evaluations: any[]) {
        const grouped = {};

        for (const evaluation of evaluations) {
            const key = `${evaluation.cycle}-${evaluation.evaluateeId}`;
            if (!grouped[key]) {
                grouped[key] = {
                    cycle: evaluation.cycle,
                    userId: evaluation.evaluateeId,
                    user: evaluation.evaluatee,
                    evaluations: [],
                };
            }
            grouped[key].evaluations.push(evaluation);
        }

        return Object.values(grouped);
    }
}
