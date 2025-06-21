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
        mentoring: MentoringDto[],
        prismaClient?: Prisma.TransactionClient,
    ) {
        const client = prismaClient || this.prisma;

        // Só cria se houver mentorias
        if (!mentoring || mentoring.length === 0) {
            return [];
        }

        return await Promise.all(
            mentoring.map((mentor) =>
                client.mentoring.create({
                    data: {
                        evaluationId: evaluationId,
                        evaluatorId: mentor.mentorId,
                        evaluatedId: colaboradorId,
                        justification: mentor.justificativa,
                        cycle: ciclo,
                    },
                }),
            ),
        );
    }

    async getMentoringByEvaluationId(evaluationId: number) {
        return await this.prisma.mentoring.findMany({
            where: { evaluationId },
        });
    }
}
