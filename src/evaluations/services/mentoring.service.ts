import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MentoringDto } from '../interfaces/evaluation.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class MentoringService {
    constructor(private prisma: PrismaService) {}

    async createMentoring(
        evaluationId: number,
        colaboradorId: number,
        ciclo: string,
        mentoring: MentoringDto | null,
        prismaClient?: Prisma.TransactionClient,
    ) {
        const client = prismaClient || this.prisma;

        // Só cria se houver mentoria
        if (!mentoring) {
            return null;
        }

        return await client.mentoring.create({
            data: {
                evaluationId: evaluationId,
                evaluatorId: mentoring.mentorId,
                evaluatedId: colaboradorId,
                justification: mentoring.justificativa,
                cycle: ciclo,
            },
        });
    }

    async getMentoringByEvaluationId(evaluationId: number) {
        return await this.prisma.mentoring.findFirst({
            where: { evaluationId },
        });
    }
}
