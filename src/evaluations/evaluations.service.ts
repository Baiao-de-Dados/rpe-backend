import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

        // Extrair o trackId corretamente
        const userTrackId = user.trackId ?? user.track?.id;

        // VALIDAÇÕES PRÉVIAS - Usando o service de validação
        await this.validationService.validateEvaluationData(createEvaluationDto);

        // Usar transação para garantir atomicidade
        return await this.prisma.$transaction(async (prisma: PrismaClient) => {
            // Criar apenas UMA Evaluation para o colaborador/ciclo
            const evaluation = await prisma.evaluation.create({
                data: {
                    evaluatorId: colaboradorId,
                    cycleConfigId: cycleConfigId,
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
                            new Date() >= cycle.startDate &&
                            new Date() <= cycle.endDate,
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

            // Retorna a estrutura compatível com o formato anterior
            return this.formatEvaluationResponse([evaluation], colaboradorId, cycleConfigId);
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
            const now = new Date();
            return !cycle.done && now >= cycle.startDate && now <= cycle.endDate;
        });

        if (!activeCycle) {
            throw new NotFoundException('Nenhum ciclo de avaliação ativo encontrado');
        }

        // 2. Verificar se o ciclo está dentro do prazo
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
}
