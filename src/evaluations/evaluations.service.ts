import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { Peer360EvaluationService } from '../evaluations/evaluation360/services/peer360-evaluation.service';
import { ReferenceService } from '../evaluations/references/services/reference.service';
import { AutoEvaluationService } from '../evaluations/autoevaluations/services/auto-evaluation.service';
import { MentorEvaluationService } from '../evaluations/mentoring/service/mentor-evaluation.service';
import { CycleConfigService } from 'src/cycles/cycle-config.service';
import { ActiveCriteriaUserResponseDto } from './dto/active-criteria-response.dto';
import type { PrismaClient } from '@prisma/client';
import { getBrazilDate } from 'src/cycles/utils';

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

    async createEvaluation(createEvaluationDto: CreateEvaluationDto, user: any) {
        const {
            cycleConfigId,
            colaboradorId,
            autoavaliacao,
            avaliacao360,
            mentoring,
            referencias,
        } = createEvaluationDto;

        // Garante que só pode criar avaliação para si mesmo
        if (colaboradorId !== user.sub && colaboradorId !== user.id) {
            throw new ForbiddenException('Você só pode criar avaliações para você mesmo.');
        }

        // Extrair o trackId corretamente
        const userTrackId = user.trackId ?? user.track?.id;

        // VALIDAÇÕES PRÉVIAS - Usando o service de validação
        await this.validationService.validateEvaluationData(createEvaluationDto);

        // Buscar o usuário para obter o trackId
        const userDb = await this.prisma.user.findUnique({
            where: { id: colaboradorId },
        });
        if (!userDb) throw new NotFoundException('Usuário não encontrado');

        // Usar transação para garantir atomicidade
        return await this.prisma.$transaction(async (prisma: PrismaClient) => {
            // Criar apenas UMA Evaluation para o colaborador/ciclo
            const evaluation = await prisma.evaluation.create({
                data: {
                    evaluatorId: colaboradorId,
                    cycleConfigId: cycleConfigId,
                    trackId: userDb.trackId,
                },
            });

            // 1. Criar autoavaliação associada à Evaluation criada
            if (autoavaliacao && autoavaliacao.pilares && autoavaliacao.pilares.length > 0) {
                // Validar critérios antes de criar (usando a lógica do autoEvaluationService)
                if (userTrackId) {
                    // Buscar configurações de critério para a trilha do usuário no ciclo ativo
                    const activeCycle = (await prisma.cycleConfig.findMany()).find(
                        (cycle) =>
                            !cycle.done &&
                            cycle.startDate !== null &&
                            cycle.endDate !== null &&
                            new Date(getBrazilDate()) >= cycle.startDate &&
                            new Date(getBrazilDate()) <= cycle.endDate,
                    );

                    if (!activeCycle) {
                        throw new BadRequestException('Nenhum ciclo ativo encontrado');
                    }

                    const userTrackCriteria = await prisma.criterionTrackCycleConfig.findMany({
                        where: {
                            trackId: userTrackId,
                            cycleId: activeCycle.id,
                        },
                        include: {
                            criterion: true,
                        },
                    });

                    if (!userTrackCriteria || userTrackCriteria.length === 0) {
                        throw new BadRequestException(
                            `Nenhum critério configurado para sua trilha (${userTrackId})`,
                        );
                    }

                    // Criar conjunto de critérios autorizados para o usuário
                    const authorizedCriteriaIds = new Set<number>(
                        userTrackCriteria.map((config) => config.criterionId),
                    );

                    // Validar se todos os critérios enviados estão autorizados para o usuário
                    const submittedCriteriaIds = new Set();
                    const unauthorizedCriteria: number[] = [];

                    for (const pilar of autoavaliacao.pilares) {
                        for (const criterio of pilar.criterios) {
                            const criterionId = criterio.criterioId;
                            submittedCriteriaIds.add(criterionId);

                            if (!authorizedCriteriaIds.has(criterionId)) {
                                unauthorizedCriteria.push(criterionId);
                            }
                        }
                    }

                    if (unauthorizedCriteria.length > 0) {
                        throw new BadRequestException(
                            `Critérios não autorizados para sua trilha (${userTrackId}): ${unauthorizedCriteria.join(', ')}`,
                        );
                    }
                }

                // Criar o registro de autoavaliação
                await prisma.autoEvaluation.create({
                    data: {
                        evaluationId: evaluation.id,
                    },
                });

                // Criar os critérios da autoavaliação
                for (const pilar of autoavaliacao.pilares) {
                    for (const criterio of pilar.criterios) {
                        await prisma.autoEvaluationAssignment.create({
                            data: {
                                evaluationId: evaluation.id,
                                criterionId: criterio.criterioId,
                                score: criterio.nota,
                                justification: criterio.justificativa,
                            },
                        });
                    }
                }

                // Calcular e atualizar o rating da autoavaliação
                // Buscar assignments e pesos dos critérios para a trilha/ciclo
                const assignments = await prisma.autoEvaluationAssignment.findMany({
                    where: { evaluationId: evaluation.id },
                });
                const trackId = userTrackId;
                const cycleId = cycleConfigId;
                const weights = await prisma.criterionTrackCycleConfig.findMany({
                    where: { trackId, cycleId },
                });
                const weightMap = new Map(weights.map((w) => [w.criterionId, w.weight]));
                let total = 0;
                let totalWeight = 0;
                for (const a of assignments) {
                    const weight = weightMap.get(a.criterionId) ?? 1;
                    total += a.score * weight;
                    totalWeight += weight;
                }
                const ratingRaw = totalWeight > 0 ? total / totalWeight : 0;
                const rating = Math.round(ratingRaw * 10) / 10;
                await prisma.autoEvaluation.update({
                    where: { evaluationId: evaluation.id },
                    data: { rating },
                });
            }

            // 2. Criar avaliações 360 associadas à Evaluation criada
            if (avaliacao360 && avaliacao360.length > 0) {
                for (const avaliacao of avaliacao360) {
                    await prisma.evaluation360.create({
                        data: {
                            evaluationId: evaluation.id,
                            evaluatedId: avaliacao.avaliadoId,
                            strengths: avaliacao.pontosFortes ?? '',
                            improvements: avaliacao.pontosMelhoria ?? '',
                            score: avaliacao.score ?? 0,
                        },
                    });
                }
            }

            // 3. Criar mentoring associado à Evaluation criada
            if (mentoring && mentoring.mentorId && mentoring.justificativa) {
                await prisma.mentoring.create({
                    data: {
                        evaluationId: evaluation.id,
                        mentorId: mentoring.mentorId,
                        justification: mentoring.justificativa,
                        score: mentoring.score,
                    },
                });
            }

            // 4. Criar referências associadas à Evaluation criada
            if (referencias && referencias.length > 0) {
                for (const referencia of referencias) {
                    await prisma.reference.create({
                        data: {
                            evaluationId: evaluation.id,
                            collaboratorId: referencia.colaboradorId,
                            justification: referencia.justificativa,
                        },
                    });
                }
            }

            // Retorna a estrutura completa com todos os relacionamentos populados (dentro da transação)
            const evaluationWithRelations = await prisma.evaluation.findUnique({
                where: { id: evaluation.id },
                include: {
                    evaluator: {
                        include: { track: true },
                    },
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

            if (!evaluationWithRelations) {
                throw new NotFoundException('Erro ao buscar avaliação recém-criada');
            }

            return {
                id: evaluationWithRelations.id,
                cycleConfigId: evaluationWithRelations.cycleConfigId,
                userId: evaluationWithRelations.evaluatorId,
                grade: 0, // Calcule se desejar
                user: evaluationWithRelations.evaluator
                    ? {
                          id: evaluationWithRelations.evaluator.id,
                          name: evaluationWithRelations.evaluator.name,
                          track: evaluationWithRelations.evaluator.track?.name ?? null,
                      }
                    : null,
                autoEvaluation: evaluationWithRelations.autoEvaluation
                    ? {
                          pilares: this.formatAutoEvaluationPilares(
                              evaluationWithRelations.autoEvaluation.assignments,
                          ),
                      }
                    : null,
                evaluation360: evaluationWithRelations.evaluation360.map((ev) => ({
                    avaliadoId: ev.evaluatedId,
                    pontosFortes: ev.strengths,
                    pontosMelhoria: ev.improvements,
                    score: ev.score,
                })),
                mentoring: evaluationWithRelations.mentoring
                    ? {
                          mentorId: evaluationWithRelations.mentoring.mentorId,
                          justificativa: evaluationWithRelations.mentoring.justification,
                          score: evaluationWithRelations.mentoring.score,
                      }
                    : null,
                reference: evaluationWithRelations.reference.map((ref) => ({
                    colaboradorId: ref.collaboratorId,
                    justificativa: ref.justification,
                })),
            };
        });
    }

    async findOne(id: number) {
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id },
            include: {
                evaluator: true,
                autoEvaluation: true,
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

    async findWithFilters(evaluatorId?: number) {
        const where: any = {};
        if (evaluatorId) where.evaluatorId = evaluatorId;
        return this.prisma.evaluation.findMany({
            where,
            include: {
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                reference: true,
                evaluator: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    private formatEvaluationResponse(
        evaluations: any[],
        colaboradorId: number,
        cycleConfigId: number,
    ) {
        // Nova estrutura: separa avaliações por tipo de relacionamento
        const autoEvaluation = evaluations.find((e) => e.autoEvaluation);
        const evaluation360 = evaluations.filter((e) => e.evaluation360);
        const mentoring = evaluations.find((e) => e.mentoring);
        const reference = evaluations.filter((e) => e.reference);

        return {
            id: evaluations[0]?.id || 0,
            cycleConfigId,
            userId: colaboradorId,
            grade: 0.0,
            user: null, // Será preenchido se necessário
            autoEvaluation: autoEvaluation || null,
            evaluation360: evaluation360 || [],
            mentoring: mentoring || null,
            reference: reference || [],
        };
    }

    async getActiveCriteriaForUser(user: any): Promise<ActiveCriteriaUserResponseDto> {
        // 1. Verificar se existe um ciclo ativo
        const activeCycle = (await this.prisma.cycleConfig.findMany()).find((cycle) => {
            const now = new Date(getBrazilDate());
            return (
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                now >= cycle.startDate &&
                now <= cycle.endDate
            );
        });

        if (!activeCycle) {
            throw new NotFoundException('Nenhum ciclo de avaliação ativo encontrado');
        }

        // 2. Verificar se o ciclo está dentro do prazo
        const now = new Date(getBrazilDate());
        if (!activeCycle.endDate || now > activeCycle.endDate) {
            throw new BadRequestException(
                `O ciclo ${activeCycle.name} expirou em ${activeCycle.endDate ? activeCycle.endDate.toLocaleDateString() : 'data indefinida'}`,
            );
        }

        if (!activeCycle.startDate || now < activeCycle.startDate) {
            throw new BadRequestException(
                `O ciclo ${activeCycle.name} ainda não começou. Início previsto para ${activeCycle.startDate ? activeCycle.startDate.toLocaleDateString() : 'data indefinida'}`,
            );
        }

        // 3. Buscar critérios ativos no ciclo atual
        const activeCycleCriteria = await this.prisma.criterionTrackCycleConfig.findMany({
            where: { cycleId: activeCycle.id },
        });
        const activeCriteriaIds = new Set(activeCycleCriteria.map((c) => c.criterionId));

        // 4. Buscar critérios configurados para a trilha/cargo do usuário
        const userTrackCriteria = await this.prisma.criterionTrackConfig.findMany({
            where: {
                trackId: user.trackId || undefined,
            },
        });

        if (!userTrackCriteria || userTrackCriteria.length === 0) {
            throw new NotFoundException(
                `Nenhum critério configurado para sua trilha (${user.track})`,
            );
        }

        // 5. Filtrar apenas critérios que estão ativos no ciclo E configurados para a trilha
        // Supondo que activeCriteriaIds é um Set de IDs de critérios ativos
        const validUserCriteria = userTrackCriteria.filter((config) =>
            activeCriteriaIds.has(config.criterionId),
        );

        if (validUserCriteria.length === 0) {
            throw new NotFoundException(
                `Nenhum critério ativo no ciclo atual para sua trilha (${user.track})`,
            );
        }

        // 6. Agrupar critérios por pilar
        // Para cada critério, buscar o pilar correspondente (precisa buscar do banco)
        const criteriosComPilar = await Promise.all(
            validUserCriteria.map(async (config) => {
                const criterion = await this.prisma.criterion.findUnique({
                    where: { id: config.criterionId },
                });
                if (!criterion) return null;
                const pillar = await this.prisma.pillar.findUnique({
                    where: { id: criterion.pillarId },
                });
                if (!pillar) return null;
                return {
                    id: config.criterionId,
                    name: criterion.name,
                    description: criterion.description,
                    weight: config.weight,
                    originalWeight: null,
                    pillar: {
                        id: pillar.id,
                        name: pillar.name,
                    },
                };
            }),
        );

        // Agrupar por pilar
        const pilaresMap = new Map();
        for (const criterio of criteriosComPilar) {
            if (!criterio) continue;
            if (!pilaresMap.has(criterio.pillar.id)) {
                pilaresMap.set(criterio.pillar.id, {
                    id: criterio.pillar.id,
                    name: criterio.pillar.name,
                    criterios: [],
                });
            }
            pilaresMap.get(criterio.pillar.id).criterios.push({
                id: criterio.id,
                name: criterio.name,
                description: criterio.description,
                weight: criterio.weight,
                originalWeight: criterio.originalWeight,
            });
        }

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
            pilares: Array.from(pilaresMap.values()),
        };
    }

    // Função auxiliar para formatar pilares da autoavaliação
    private formatAutoEvaluationPilares(assignments: any[]) {
        const pilaresMap = new Map();
        for (const a of assignments) {
            if (!pilaresMap.has(a.criterion.pillarId)) {
                pilaresMap.set(a.criterion.pillarId, {
                    pilarId: a.criterion.pillarId,
                    criterios: [],
                });
            }
            pilaresMap.get(a.criterion.pillarId).criterios.push({
                criterioId: a.criterionId,
                nota: a.score,
                justificativa: a.justification,
            });
        }
        return Array.from(pilaresMap.values());
    }
}
