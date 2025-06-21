import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReferenciaDto } from '../interfaces/evaluation.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReferenceService {
    constructor(private prisma: PrismaService) {}

    async createReferences(
        evaluationId: number,
        colaboradorId: number,
        referencias: ReferenciaDto[],
        prismaClient?: Prisma.TransactionClient,
    ) {
        const client = prismaClient || this.prisma;

        // Só cria se houver referências
        if (!referencias || referencias.length === 0) {
            return [];
        }

        return await Promise.all(
            referencias.map((referencia) =>
                client.reference.create({
                    data: {
                        evaluationId: evaluationId,
                        evaluatorId: colaboradorId,
                        evaluatedId: referencia.colaboradorId,
                        justification: referencia.justificativa,
                        cycle: new Date(),
                        tagReferences: {
                            create: referencia.tagIds.map((tagId: number) => ({
                                tag: { connect: { id: tagId } },
                            })),
                        },
                    },
                }),
            ),
        );
    }

    async getReferencesByEvaluationId(evaluationId: number) {
        return await this.prisma.reference.findMany({
            where: { evaluationId },
            include: {
                tagReferences: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
    }
}
