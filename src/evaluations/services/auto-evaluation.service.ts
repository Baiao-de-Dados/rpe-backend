import { Injectable } from '@nestjs/common';

@Injectable()
export class AutoEvaluationService {
    async createAutoEvaluation(
        prisma: any,
        autoavaliacao: any,
        colaboradorId: number,
        ciclo: string,
    ) {
        if (autoavaliacao && autoavaliacao.pilares && autoavaliacao.pilares.length > 0) {
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

            // Cria os critérios da autoavaliação
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
