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

            // Buscar critérios ativos do ciclo atual
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
            const submittedCriteriaIds = new Set();
            for (const pilar of autoavaliacao.pilares) {
                for (const criterio of pilar.criterios) {
                    const criterionId = parseInt(criterio.criterioId, 10);
                    submittedCriteriaIds.add(criterionId);

                    if (!activeCriteriaIds.has(criterionId)) {
                        throw new BadRequestException(
                            `Critério com ID ${criterionId} não está ativo no ciclo atual`,
                        );
                    }
                }
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
}
