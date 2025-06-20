import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutoAvaliacaoDto } from '../interfaces/evaluation.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class AutoEvaluationService {
    constructor(private prisma: PrismaService) {}

    async createAutoEvaluation(
        evaluationId: number,
        autoavaliacao: AutoAvaliacaoDto,
        prismaClient?: Prisma.TransactionClient,
    ) {
        const client = prismaClient || this.prisma;

        // Só cria se houver auto-avaliação
        if (!autoavaliacao || !autoavaliacao.pilares || autoavaliacao.pilares.length === 0) {
            return null;
        }

        return await client.autoEvaluation.create({
            data: {
                evaluationId: evaluationId,
                justification: autoavaliacao.justificativa,
                criteriaAssignments: {
                    create: autoavaliacao.pilares.flatMap((pilar) =>
                        pilar.criterios.map((criterio) => ({
                            criterion: { connect: { id: criterio.criterioId } },
                            note: criterio.nota,
                            justification: criterio.justificativa,
                        })),
                    ),
                },
            },
        });
    }

    async getAutoEvaluationWithCriteria(evaluationId: number) {
        return await this.prisma.autoEvaluation.findUnique({
            where: { evaluationId },
            include: {
                criteriaAssignments: {
                    include: {
                        criterion: {
                            include: {
                                pillar: true,
                            },
                        },
                    },
                },
            },
        });
    }
}
