import { Injectable, BadRequestException } from '@nestjs/common';
import { CycleValidationService } from '../../services/cycle-validation.service';
import type { PrismaClient } from '@prisma/client';
import { getBrazilDate } from 'src/cycles/utils';

@Injectable()
export class AutoEvaluationService {
    constructor(private cycleValidationService: CycleValidationService) {}

    async createAutoEvaluation(
        prisma: PrismaClient,
        autoavaliacao: {
            pilares: Array<{
                criterios: Array<{
                    criterioId: number;
                    nota: number;
                    justificativa: string;
                }>;
            }>;
        },
        colaboradorId: number,
        cycleConfigId: number,
        userTrack?: number,
    ): Promise<import('@prisma/client').Evaluation | null> {
        if (autoavaliacao && autoavaliacao.pilares && autoavaliacao.pilares.length > 0) {
            // Buscar ciclo pelo id
            const activeCycle = await prisma.cycleConfig.findFirst({
                where: { id: cycleConfigId },
            });
            if (!activeCycle) {
                throw new BadRequestException(`Ciclo com id ${cycleConfigId} não encontrado`);
            }

            // Verificar se já existe uma autoavaliação para este usuário no ciclo
            const existingAutoEvaluation = await prisma.evaluation.findFirst({
                where: {
                    evaluatorId: colaboradorId,
                    cycleConfigId: activeCycle.id,
                    autoEvaluation: {
                        isNot: null,
                    },
                },
            });

            if (existingAutoEvaluation) {
                throw new BadRequestException(
                    `Já existe uma autoavaliação para o usuário ${colaboradorId} no ciclo ${cycleConfigId}`,
                );
            }

            // Validar ciclo ativo e dentro do prazo
            await this.cycleValidationService.validateActiveCycle(prisma, 'AUTOEVALUATION');

            // Verificar se o ciclo enviado corresponde ao ciclo ativo
            const currentActiveCycle = (await prisma.cycleConfig.findMany()).find(
                (cycle) =>
                    !cycle.done &&
                    cycle.startDate !== null &&
                    cycle.endDate !== null &&
                    new Date(getBrazilDate()) >= cycle.startDate &&
                    new Date(getBrazilDate()) <= cycle.endDate,
            );

            if (currentActiveCycle && cycleConfigId !== currentActiveCycle.id) {
                throw new BadRequestException(
                    `O ciclo enviado (id: ${cycleConfigId}) não corresponde ao ciclo ativo (id: ${currentActiveCycle.id}). Use o ciclo ativo para criar autoavaliações.`,
                );
            }

            // Se temos informações de trilha do usuário, validar critérios específicos
            if (userTrack) {
                await this.validateUserCriteria(prisma, autoavaliacao, userTrack);
            } else {
                // Fallback: validar critérios ativos do ciclo atual (comportamento original)
                await this.validateCycleCriteria(prisma, autoavaliacao, userTrack);
            }

            const autoEvaluation = await prisma.evaluation.create({
                data: {
                    evaluatorId: colaboradorId,
                    cycleConfigId: activeCycle.id,
                },
            });

            // Criar o registro de autoavaliação
            await prisma.autoEvaluation.create({
                data: {
                    evaluationId: autoEvaluation.id,
                },
            });

            // Cria os critérios da autoavaliação (agora validados)
            for (const pilar of autoavaliacao.pilares) {
                for (const criterio of pilar.criterios) {
                    await prisma.autoEvaluationAssignment.create({
                        data: {
                            evaluationId: autoEvaluation.id,
                            criterionId: criterio.criterioId,
                            score: criterio.nota,
                            justification: criterio.justificativa,
                        },
                    });
                }
            }

            return autoEvaluation;
        }
        return null;
    }

    private async validateUserCriteria(
        prisma: PrismaClient,
        autoavaliacao: {
            pilares: Array<{
                criterios: Array<{
                    criterioId: number;
                }>;
            }>;
        },
        userTrack: number,
    ): Promise<void> {
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
                trackId: userTrack,
                cycleId: activeCycle.id,
                // Remover isActive se não existe no schema
            },
            include: {
                criterion: true,
            },
        });

        if (!userTrackCriteria || userTrackCriteria.length === 0) {
            throw new BadRequestException(
                `Nenhum critério configurado para sua trilha (${userTrack})`,
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
                `Critérios não autorizados para sua trilha (${userTrack}): ${unauthorizedCriteria.join(', ')}`,
            );
        }

        // Verificar se todos os critérios obrigatórios foram incluídos
        const missingCriteria = userTrackCriteria
            .map((config) => config.criterionId)
            .filter((id) => !submittedCriteriaIds.has(id));

        if (missingCriteria.length > 0) {
            const missingCriteriaNames = userTrackCriteria
                .filter((config) => missingCriteria.includes(config.criterionId))
                .map((config) =>
                    config.criterion ? config.criterion.name : `ID ${config.criterionId}`,
                )
                .join(', ');

            throw new BadRequestException(
                `Você deve avaliar todos os critérios obrigatórios para sua trilha. Critérios faltando: ${missingCriteriaNames}`,
            );
        }
    }

    private async validateCycleCriteria(
        prisma: PrismaClient,
        autoavaliacao: {
            pilares: Array<{
                criterios: Array<{
                    criterioId: number;
                }>;
            }>;
        },
        userTrack?: number,
    ): Promise<void> {
        // 1. Verificar se existe um ciclo ativo
        const activeCycle = (await prisma.cycleConfig.findMany()).find(
            (cycle) =>
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                new Date(getBrazilDate()) >= cycle.startDate &&
                new Date(getBrazilDate()) <= cycle.endDate,
        );

        if (!activeCycle) {
            throw new BadRequestException('Nenhum ciclo de avaliação ativo encontrado');
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
        // Busca todos os critérios ativos para o ciclo
        const activeCycleCriteria = await prisma.criterionTrackCycleConfig.findMany({
            where: {
                cycleId: activeCycle.id,
                // Remover isActive se não existe no schema
            },
            select: {
                criterionId: true,
            },
        });
        const activeCriteriaIds = new Set<number>(
            activeCycleCriteria.map((config) => config.criterionId),
        );

        // 4. Buscar critérios configurados para a trilha do usuário
        const userTrackCriteria = await prisma.criterionTrackConfig.findMany({
            where: {
                trackId: userTrack || undefined,
            },
            select: {
                criterionId: true,
            },
        });
        const userTrackCriteriaIds = new Set<number>(
            userTrackCriteria.map((config) => config.criterionId),
        );

        // 5. Validar se todos os critérios enviados estão ativos no ciclo E configurados para a trilha
        for (const pilar of autoavaliacao.pilares) {
            for (const criterio of pilar.criterios) {
                const criterionId = criterio.criterioId;

                if (!activeCriteriaIds.has(criterionId)) {
                    throw new BadRequestException(
                        `Critério com ID ${criterionId} não está ativo no ciclo atual`,
                    );
                }

                if (!userTrackCriteriaIds.has(criterionId)) {
                    throw new BadRequestException(
                        `Critério com ID ${criterionId} não está configurado para sua trilha (${userTrack})`,
                    );
                }
            }
        }
    }
}
