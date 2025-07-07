import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { ReferenceService } from './services/reference.service';
import { AutoEvaluationService } from './autoevaluations/services/auto-evaluation.service';
import { MentorEvaluationService } from './services/mentor-evaluation.service';
import { CycleConfigService } from './cycles/cycle-config.service';
import { ActiveCriteriaUserResponseDto } from './dto/active-criteria-response.dto';

@Injectable()
export class EvaluationsService {
    constructor(
        private prisma: PrismaService,
        private validationService: EvaluationValidationService,
        private peer360EvaluationService: Peer360EvaluationService,
        private referenceService: ReferenceService,
        private autoEvaluationService: AutoEvaluationService,
        private mentorEvaluationService: MentorEvaluationService,
        private readonly cycleConfigService: CycleConfigService,
    ) {}

    async createEvaluation(createEvaluationDto: CreateEvaluationDto, userTrack?: number) {
        const {
            cycleConfigId,
            colaboradorId,
            autoavaliacao,
            avaliacao360,
            mentoring,
            referencias,
        } = createEvaluationDto;

        // colaboradorId já é number
        const colaboradorIdNumber = colaboradorId;

        // VALIDAÇÕES PRÉVIAS - Usando o service de validação
        await this.validationService.validateEvaluationData(createEvaluationDto);

        return await this.prisma.$transaction(async (prisma) => {
            // 1. Cria a autoavaliação usando o service (com validação de trilha)
            const autoEvaluation = await this.autoEvaluationService.createAutoEvaluation(
                prisma,
                autoavaliacao,
                colaboradorIdNumber,
                cycleConfigId,
                userTrack,
            );

            // 2. Cria as avaliações 360
            const peerEvaluations = await this.peer360EvaluationService.createPeer360Evaluations(
                prisma,
                avaliacao360,
                colaboradorIdNumber,
                cycleConfigId,
            );

            // 3. Cria as avaliações de mentor
            let mentorEvaluation = null;
            if (mentoring && mentoring.mentorId) {
                mentorEvaluation = await this.mentorEvaluationService.createMentorEvaluation(
                    prisma,
                    mentoring.mentorId,
                    colaboradorIdNumber,
                    mentoring.justificativa,
                    cycleConfigId,
                );
            }

            // 4. Cria as referências usando o service
            await this.referenceService.createReferences(prisma, referencias, colaboradorIdNumber);

            // Retorna a estrutura compatível com o formato anterior
            return this.formatEvaluationResponse(
                autoEvaluation,
                peerEvaluations,
                mentorEvaluation,
                colaboradorIdNumber,
                ciclo,
            );
        });
    }

    async findOne(id: number) {
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id },
            include: {
                evaluator: true,
                evaluatee: true,
                autoEvaluation: {
                    include: {
                        assignments: {
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
                reference: true,
            },
        });

        if (!evaluation) {
            throw new NotFoundException(`Avaliação com ID ${id} não encontrada`);
        }
        return evaluation;
    }

    async findWithFilters(type?: string, evaluateeId?: number, evaluatorId?: number) {
        const where: any = {};
        if (evaluateeId) where.evaluateeId = evaluateeId;
        if (evaluatorId) where.evaluatorId = evaluatorId;
        return this.prisma.evaluation.findMany({
            where,
            include: {
                evaluator: true,
                evaluatee: true,
                autoEvaluation: {
                    include: {
                        assignments: {
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
                reference: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    private async formatEvaluationResponse(
        autoEvaluation: any,
        peerEvaluations: any[],
        mentorEvaluation: any,
        colaboradorId: number,
        cycleConfigId: number,
    ) {
        // Busca referências relacionadas
        const references = await this.prisma.reference.findMany({
            where: {
                evaluation: {
                    evaluateeId: colaboradorId,
                },
            },
        });

        return {
            id: evaluations[0]?.id || 0,
            cycle: cycleConfigId,
            userId: colaboradorId,
            cycle: ciclo,
            grade: 0.0,
            user: null, // Será preenchido se necessário
            autoEvaluation: autoEvaluation
                ? {
                      id: autoEvaluation.id,
                      evaluationId: autoEvaluation.evaluationId,
                      justification: autoEvaluation.justification,
                      criteriaAssignments: autoEvaluation.assignments ?? [],
                  }
                : null,
            evaluation360: peerEvaluations.map((e) => ({
                id: e.id,
                evaluationId: e.evaluationId,
                evaluatorId: e.evaluatorId,
                evaluatedId: e.evaluatedId,
                strengths: e.strenghts ?? '',
                improvements: e.improvements ?? '',
            })),
            mentoring: mentorEvaluation
                ? {
                      id: mentorEvaluation.id,
                      evaluationId: mentorEvaluation.evaluationId,
                      evaluatorId: mentorEvaluation.evaluatorId,
                      evaluatedId: mentorEvaluation.evaluateeId,
                      justification: mentorEvaluation.justification,
                      cycle: ciclo,
                  }
                : null,
            references: references.map((r) => ({
                evaluationId: r.evaluationId,
                justification: r.justification,
                createdAt: r.createdAt,
            })),
        };
    }

    async getActiveCriteriaForUser(user: any): Promise<ActiveCriteriaUserResponseDto> {
        const activeCycle = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
        });

        if (!activeCycle) {
            throw new NotFoundException('Nenhum ciclo de avaliação ativo encontrado');
        }

        const now = new Date();
        if (now > activeCycle.endDate) {
            throw new BadRequestException(
                `O ciclo ${activeCycle.name} expirou em ${activeCycle.endDate.toLocaleDateString()}`,
            );
        }

        if (now < activeCycle.startDate) {
            throw new BadRequestException(
                `O ciclo ${activeCycle.name} ainda não começou. Início previsto para ${activeCycle.startDate.toLocaleDateString()}`,
            );
        }

        const activeCycleCriteria = await this.cycleConfigService.getActiveCriteria();
        const activeCriteriaIds = new Set(activeCycleCriteria.map((c) => c.id));

        // 4. Buscar configurações de critério para a trilha do usuário no ciclo ativo
        const userTrackCriteria = await this.prisma.criterionTrackCycleConfig.findMany({
            where: {
                trackId: user.trackId,
                cycleId: activeCycle.id,
            },
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });

        if (!userTrackCriteria || userTrackCriteria.length === 0) {
            throw new NotFoundException(
                `Nenhum critério configurado para sua trilha (${user.track})`,
            );
        }

        // 5. Filtrar critérios que estão ativos no ciclo E configurados para a trilha do usuário
        const userActiveCriteria = userTrackCriteria.map((trackConfig) => ({
            id: trackConfig.criterion.id,
            name: trackConfig.criterion.name,
            description: trackConfig.criterion.description,
            weight: trackConfig.weight,
            pillar: {
                id: trackConfig.criterion.pillar.id,
                name: trackConfig.criterion.pillar.name,
            },
        }));

        if (userActiveCriteria.length === 0) {
            throw new NotFoundException(
                `Nenhum critério ativo no ciclo atual para sua trilha (${user.track})`,
            );
        }

        const groupedByPillar = validUserCriteria.reduce((acc, config) => {
            const pillar = config.criterion.pillar;
            const pillarId = pillar.id;

            if (!acc[pillarId]) {
                acc[pillarId] = {
                    id: pillar.id,
                    name: pillar.name,
                    criterios: [],
                };
            }

            acc[pillarId].criterios.push({
                id: config.criterion.id,
                name: config.criterion.name,
                description: config.criterion.description,
                weight: config.weight, // Peso da configuração de trilha
                originalWeight: null, // Critério base não tem peso
            });

            return acc;
        }, {});

        return {
            user: {
                id: user.sub,
                track: user.track,
            },
            cycle: {
                id: activeCycle.id,
                name: activeCycle.name,
                startDate: activeCycle.startDate,
                endDate: activeCycle.endDate,
            },
            pilares: userActiveCriteria,
        };
    }
}
