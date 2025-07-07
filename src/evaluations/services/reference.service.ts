import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ReferenceService {
    async createReferences(
        prisma: any,
        referencias: any[],
        colaboradorId: number,
        cycleConfigId: number,
    ) {
        if (!referencias || referencias.length === 0) {
            throw new BadRequestException('Referências são obrigatórias');
        }

        for (const referencia of referencias) {
            if (!referencia.justificativa) {
                throw new BadRequestException('Justificativa é obrigatória na referência');
            }
            if (!referencia.colaboradorId) {
                throw new BadRequestException('ID do colaborador de referência é obrigatório');
            }

            const evaluation = await prisma.evaluation.create({
                data: {
                    evaluatorId: colaboradorId,
                    evaluateeId: parseInt(referencia.colaboradorId, 10),
                    cycleConfigId: cycleConfigId,
                },
            });

            // Criar o registro de reference
            await prisma.reference.create({
                data: {
                    evaluationId: evaluation.id,
                    justification: referencia.justificativa,
                },
            });
        }
    }
}
