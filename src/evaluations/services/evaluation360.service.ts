import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Avaliacao360Dto } from '../interfaces/evaluation.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class Evaluation360Service {
    constructor(private prisma: PrismaService) {}

    async createEvaluation360(
        evaluationId: number,
        colaboradorId: number,
        avaliacao360: Avaliacao360Dto[],
        prismaClient?: Prisma.TransactionClient,
    ) {
        const client = prismaClient || this.prisma;

        // Só cria se houver avaliações 360
        if (!avaliacao360 || avaliacao360.length === 0) {
            return [];
        }

        return await Promise.all(
            avaliacao360.map((avaliacao) =>
                client.evaluation360.create({
                    data: {
                        evaluationId: evaluationId,
                        evaluatorId: colaboradorId,
                        evaluatedId: avaliacao.avaliadoId,
                        strengths: avaliacao.pontosFortes || '',
                        improvements: avaliacao.pontosMelhoria || '',
                    },
                }),
            ),
        );
    }

    async getEvaluation360ByEvaluationId(evaluationId: number) {
        return await this.prisma.evaluation360.findMany({
            where: { evaluationId },
        });
    }
}
