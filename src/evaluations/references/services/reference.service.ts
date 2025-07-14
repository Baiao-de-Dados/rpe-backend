import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient, Evaluation } from '@prisma/client';

@Injectable()
export class ReferenceService {
    async createReferences(
        prisma: PrismaClient,
        referencias: Array<{
            justificativa: string;
            colaboradorId: number | string;
        }>,
        colaboradorId: number,
        cycleConfigId: number,
    ): Promise<Evaluation[]> {
        if (!referencias || referencias.length === 0) {
            throw new BadRequestException('Referências são obrigatórias');
        }

        const evaluations: Evaluation[] = [];

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
                    evaluateeId:
                        typeof referencia.colaboradorId === 'string'
                            ? parseInt(referencia.colaboradorId, 10)
                            : referencia.colaboradorId,
                    cycleConfigId: cycleConfigId,
                },
            });

            await prisma.reference.create({
                data: {
                    evaluationId: evaluation.id,
                    justification: referencia.justificativa,
                },
            });

            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
