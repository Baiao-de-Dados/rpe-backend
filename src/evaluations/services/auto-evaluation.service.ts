import { Injectable, BadRequestException } from '@nestjs/common';
import { CycleValidationService } from './cycle-validation.service';

@Injectable()
export class AutoEvaluationService {
    constructor(private cycleValidationService: CycleValidationService) {}

    async createAutoEvaluation(
        prisma: any,
        autoavaliacao: any,
        colaboradorId: number,
        ciclo: string,
        userTrack?: string,
    ) {
        if (autoavaliacao && autoavaliacao.pilares && autoavaliacao.pilares.length > 0) {
            // Verificar se já existe uma autoavaliação para este usuário no ciclo
            const existingAutoEvaluation = await prisma.evaluation.findFirst({
                where: {
                    type: 'AUTOEVALUATION',
                    evaluateeId: colaboradorId,
                    cycle: parseInt(ciclo.replace(/\D/g, '')),
                },
            });

            if (existingAutoEvaluation) {
                throw new BadRequestException(
                    `Já existe uma autoavaliação para o usuário ${colaboradorId} no ciclo ${ciclo}`,
                );
            }

            // Validar ciclo ativo e dentro do prazo
            await this.cycleValidationService.validateActiveCycle(prisma, 'AUTOEVALUATION');

            // Verificar se o ciclo enviado corresponde ao ciclo ativo
            const activeCycle = await prisma.cycleConfig.findFirst({
                where: { isActive: true },
            });

            if (activeCycle && ciclo !== activeCycle.name) {
                throw new BadRequestException(
                    `O ciclo enviado (${ciclo}) não corresponde ao ciclo ativo (${activeCycle.name}). Use o ciclo ativo para criar autoavaliações.`,
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
                    type: 'AUTOEVALUATION',
                    evaluatorId: colaboradorId,
                    evaluateeId: colaboradorId,
                    cycle: parseInt(ciclo.replace(/\D/g, '')),
                    justification: 'Autoavaliação', // Justificativa padrão
                    score: 0,
                },
            });

            // Cria os critérios da autoavaliação (agora validados)
            for (const pilar of autoavaliacao.pilares) {
                for (const criterio of pilar.criterios) {
                    await prisma.criteriaAssignment.create({
                        data: {
                            autoEvaluationID: autoEvaluation.id,
                            criterionId: parseInt(criterio.criterioId, 10),
                            note: criterio.nota,
                            justification: criterio.justificativa,
                        },
                    });
                }
            }

            return autoEvaluation;
        }
        return null;
    }

    private async validateUserCriteria(prisma: any, autoavaliacao: any, userTrack: string) {
        // Buscar configurações de critério para a trilha do usuário no ciclo ativo
        const activeCycle = await prisma.cycleConfig.findFirst({
            where: { isActive: true },
        });

        if (!activeCycle) {
            throw new BadRequestException('Nenhum ciclo ativo encontrado');
        }

        const userTrackCriteria = await prisma.criterionTrackCycleConfig.findMany({
            where: {
                trackId: userTrack,
                cycleId: activeCycle.id,
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
            throw new BadRequestException(
                `Nenhum critério configurado para sua trilha (${userTrack})`,
            );
        }

        // Criar conjunto de critérios autorizados para o usuário
        const authorizedCriteriaIds = new Set(
            userTrackCriteria.map((config: any) => config.criterionId),
        );

        // Validar se todos os critérios enviados estão autorizados para o usuário
        const submittedCriteriaIds = new Set();
        const unauthorizedCriteria: number[] = [];

        for (const pilar of autoavaliacao.pilares) {
            for (const criterio of pilar.criterios) {
                const criterionId = parseInt(criterio.criterioId, 10);
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
            .map((config: any) => config.criterionId)
            .filter((id: number) => !submittedCriteriaIds.has(id));

        if (missingCriteria.length > 0) {
            const missingCriteriaNames = userTrackCriteria
                .filter((config: any) => missingCriteria.includes(config.criterionId))
                .map((config: any) => config.criterion.name)
                .join(', ');

            throw new BadRequestException(
                `Você deve avaliar todos os critérios obrigatórios para sua trilha. Critérios faltando: ${missingCriteriaNames}`,
            );
        }
    }

    private async validateCycleCriteria(prisma: any, autoavaliacao: any, userTrack?: string) {
        // 1. Verificar se existe um ciclo ativo
        const activeCycle = await prisma.cycleConfig.findFirst({
            where: { isActive: true },
        });

        if (!activeCycle) {
            throw new BadRequestException('Nenhum ciclo de avaliação ativo encontrado');
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
        const activeCycleCriteria = await prisma.cycleConfig.findFirst({
            where: { isActive: true },
            include: {
                criterionConfigs: {
                    where: { isActive: true },
                    include: {
                        criterion: true,
                    },
                },
            },
        });

        const activeCriteriaIds = new Set(
            activeCycleCriteria.criterionConfigs.map((config: any) => config.criterionId),
        );

        // 4. Buscar critérios configurados para a trilha do usuário
        const userTrackCriteria = await prisma.criterionTrackCycleConfig.findMany({
            where: {
                trackId: userTrack || undefined,
                cycleId: activeCycle.id,
                isActive: true,
            },
            select: {
                criterionId: true,
            },
        });

        const userTrackCriteriaIds = new Set(userTrackCriteria.map((config) => config.criterionId));

        // 5. Validar se todos os critérios enviados estão ativos no ciclo E configurados para a trilha
        for (const pilar of autoavaliacao.pilares) {
            for (const criterio of pilar.criterios) {
                const criterionId = parseInt(criterio.criterioId, 10);

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
