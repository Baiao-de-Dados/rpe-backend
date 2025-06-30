import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { ReferenceService } from './services/reference.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { MentorEvaluationService } from './services/mentor-evaluation.service';
import { CycleConfigService } from '../cycle-config/cycle-config.service';
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

    async createEvaluation(
        createEvaluationDto: CreateEvaluationDto,
        userTrack?: string,
        userPosition?: string,
    ) {
        const { ciclo, colaboradorId, autoavaliacao, avaliacao360, mentoring, referencias } =
            createEvaluationDto;

        // Converter colaboradorId de string para number
        const colaboradorIdNumber = parseInt(colaboradorId, 10);

        // VALIDAÇÕES PRÉVIAS - Usando o service de validação
        await this.validationService.validateEvaluationData(createEvaluationDto);

        // Usar transação para garantir atomicidade
        return await this.prisma.$transaction(async (prisma) => {
            const evaluations: any[] = [];

            // 1. Cria a autoavaliação usando o service (com validação de trilha/cargo)
            const autoEvaluation = await this.autoEvaluationService.createAutoEvaluation(
                prisma,
                autoavaliacao,
                colaboradorIdNumber,
                ciclo,
                userTrack,
                userPosition,
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

    async findWithFilters(type?: string, evaluateeId?: number, evaluatorId?: number) {
        const where: any = {};
        if (type) where.type = type as any;
        if (evaluateeId) where.evaluateeId = evaluateeId;
        if (evaluatorId) where.evaluatorId = evaluatorId;
        return this.prisma.evaluation.findMany({
            where,
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
            orderBy: { createdAt: 'desc' },
        });
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
                track: user.track || null,
                position: user.position || null,
                isActive: true,
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
                `Nenhum critério configurado para sua trilha (${user.track}) e cargo (${user.position})`,
            );
        }

        // 5. Filtrar apenas critérios que estão ativos no ciclo E configurados para a trilha
        const validUserCriteria = userTrackCriteria.filter((config) =>
            activeCriteriaIds.has(config.criterion.id),
        );

        if (validUserCriteria.length === 0) {
            throw new NotFoundException(
                `Nenhum critério ativo no ciclo atual para sua trilha (${user.track}) e cargo (${user.position})`,
            );
        }

        // 6. Agrupar critérios por pilar
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
                weight: config.weight, // Usa o peso personalizado da configuração de trilha
                originalWeight: config.criterion.weight ?? null, // Peso original do critério
            });

            return acc;
        }, {});

        return {
            user: {
                id: user.sub,
                track: user.track,
                position: user.position,
            },
            cycle: {
                id: activeCycle.id,
                name: activeCycle.name,
                startDate: activeCycle.startDate,
                endDate: activeCycle.endDate,
            },
            pilares: Object.values(groupedByPillar),
        };
    }
}
