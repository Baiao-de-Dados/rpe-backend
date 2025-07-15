import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient, Evaluation } from '@prisma/client';

@Injectable()
export class ReferenceService {
    async createReferences(
        prisma: PrismaClient,
        referencias:
            | Array<{
                  justificativa: string;
                  colaboradorId: number | string;
              }>
            | undefined,
        colaboradorId: number,
        cycleConfigId: number,
    ): Promise<Evaluation[]> {
        if (!referencias || referencias.length === 0) {
            return [];
        }

        const evaluations: Evaluation[] = [];

        for (const referencia of referencias) {
            if (!referencia.justificativa) {
                throw new BadRequestException('Justificativa é obrigatória na referência');
            }
            if (!referencia.colaboradorId) {
                throw new BadRequestException('ID do colaborador de referência é obrigatório');
            }
            let evaluation = await prisma.evaluation.findFirst({
                where: {
                    evaluatorId: colaboradorId,
                    cycleConfigId: cycleConfigId,
                },
            });
            if (!evaluation) {
                evaluation = await prisma.evaluation.create({
                    data: {
                        evaluatorId: colaboradorId,
                        cycleConfigId: cycleConfigId,
                    },
                });
            }

            await prisma.reference.create({
                data: {
                    evaluationId: evaluation.id,
                    collaboratorId: Number(referencia.colaboradorId),
                    justification: referencia.justificativa,
                },
            });

            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
