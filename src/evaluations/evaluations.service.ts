import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { ReferenceService } from './services/reference.service';
import { AutoEvaluationService } from 'src/evaluations/autoevaluations/services/auto-evaluation.service';
import { MentorEvaluationService } from './services/mentor-evaluation.service';
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

    async createEvaluation(createEvaluationDto: CreateEvaluationDto, userTrack?: number) {
        const {
            cycleConfigId,
            colaboradorId,
            autoavaliacao,
            avaliacao360,
            mentoring,
            referencias,
        } = createEvaluationDto;

        // VALIDAÇÕES PRÉVIAS - Usando o service de validação
        await this.validationService.validateEvaluationData(createEvaluationDto);

        // Usar transação para garantir atomicidade
        return await this.prisma.$transaction(async (prisma: PrismaClient) => {
            const evaluations: any[] = [];

            // 1. Cria a autoavaliação usando o service (com validação de trilha/cargo)
            const autoEvaluation = await this.autoEvaluationService.createAutoEvaluation(
                prisma,
                autoavaliacao,
                colaboradorId,
                cycleConfigId,
                userTrack,
            );
            if (autoEvaluation) {
                evaluations.push(autoEvaluation);
            }

            // 2. Cria as avaliações 360 (PEER_360) usando o service
            const peerEvaluations = await this.peer360EvaluationService.createPeer360Evaluations(
                prisma,
                avaliacao360,
                colaboradorId,
                cycleConfigId,
            );
            evaluations.push(...peerEvaluations);

            // 3. Cria as avaliações de mentor usando o service
            if (mentoring && mentoring.mentorId && mentoring.justificativa) {
                const mentorEvaluation = await this.mentorEvaluationService.createMentorEvaluation(
                    prisma,
                    mentoring.mentorId,
                    colaboradorId,
                    mentoring.justificativa,
                    cycleConfigId,
                );
                evaluations.push(mentorEvaluation);
            }

            // 4. Cria as referências usando o service
            await this.referenceService.createReferences(
                prisma,
                referencias,
                colaboradorId,
                cycleConfigId,
            );

            // Retorna a estrutura compatível com o formato anterior
            return this.formatEvaluationResponse(evaluations, colaboradorId, cycleConfigId);
        });
    }

    async findOne(id: number) {
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id },
            include: {
                evaluator: true,
                evaluatee: true,
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

    async findWithFilters(evaluateeId?: number, evaluatorId?: number) {
        const where: any = {};
        if (evaluateeId) where.evaluateeId = evaluateeId;
        if (evaluatorId) where.evaluatorId = evaluatorId;
        return this.prisma.evaluation.findMany({
            where,
            include: {
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                reference: true,
                evaluator: true,
                evaluatee: true,
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
        const activeCycle = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
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
        const activeCycleCriteria = await this.cycleConfigService.getActiveCriteria();
        const activeCriteriaIds = new Set(activeCycleCriteria.map((c) => c.id));

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
