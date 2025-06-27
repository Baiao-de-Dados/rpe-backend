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
        userPosition?: string,
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

            // Se temos informações de trilha/cargo do usuário, validar critérios específicos
            if (userTrack && userPosition) {
                await this.validateUserCriteria(prisma, autoavaliacao, userTrack, userPosition);
            } else {
                // Fallback: validar critérios ativos do ciclo atual (comportamento original)
                await this.validateCycleCriteria(prisma, autoavaliacao);
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

    private async validateUserCriteria(
        prisma: any,
        autoavaliacao: any,
        userTrack: string,
        userPosition: string,
    ) {
        // Buscar critérios ativos para a trilha/cargo específica do usuário
        const userCriterionConfigs = await prisma.criterionTrackConfig.findMany({
            where: {
                track: userTrack,
                position: userPosition,
                isActive: true,
            },
            include: {
                criterion: true,
            },
        });

        if (!userCriterionConfigs || userCriterionConfigs.length === 0) {
            throw new BadRequestException(
                `Nenhum critério configurado para sua trilha (${userTrack}) e cargo (${userPosition})`,
            );
        }

        // Criar conjunto de critérios autorizados para o usuário
        const authorizedCriteriaIds = new Set(
            userCriterionConfigs.map((config: any) => config.criterionId),
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
                `Critérios não autorizados para sua trilha (${userTrack}) e cargo (${userPosition}): ${unauthorizedCriteria.join(', ')}`,
            );
        }

        // Verificar se todos os critérios obrigatórios foram incluídos
        const missingCriteria = userCriterionConfigs
            .map((config: any) => config.criterionId)
            .filter((id: number) => !submittedCriteriaIds.has(id));

        if (missingCriteria.length > 0) {
            const missingCriteriaNames = userCriterionConfigs
                .filter((config: any) => missingCriteria.includes(config.criterionId))
                .map((config: any) => config.criterion.name)
                .join(', ');

            throw new BadRequestException(
                `Você deve avaliar todos os critérios obrigatórios para sua trilha/cargo. Critérios faltando: ${missingCriteriaNames}`,
            );
        }
    }

    private async validateCycleCriteria(prisma: any, autoavaliacao: any) {
        // Buscar critérios ativos do ciclo atual (comportamento original)
        const activeCycle = await prisma.cycleConfig.findFirst({
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

        // Criar conjunto de critérios ativos para validação rápida
        const activeCriteriaIds = new Set(
            activeCycle.criterionConfigs.map((config: any) => config.criterionId),
        );

        // Validar se todos os critérios enviados estão ativos
        for (const pilar of autoavaliacao.pilares) {
            for (const criterio of pilar.criterios) {
                const criterionId = parseInt(criterio.criterioId, 10);

                if (!activeCriteriaIds.has(criterionId)) {
                    throw new BadRequestException(
                        `Critério com ID ${criterionId} não está ativo no ciclo atual`,
                    );
                }
            }
        }
    }
}
