import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EvaluationDraftService {
    constructor(private readonly prisma: PrismaService) {}

    async saveDraft(userId: number, cycleId: number, draft: any) {
        // Validação manual dos tipos dos IDs
        if (!Array.isArray(draft)) {
            throw new BadRequestException('Draft deve ser um array');
        }
        for (const item of draft) {
            if (typeof item.pillarId !== 'number' || typeof item.criteriaId !== 'number') {
                throw new BadRequestException('pillarId e criteriaId devem ser números');
            }
        }

        const existing = await this.prisma.evaluationDraft.findFirst({
            where: { userId, cycleId },
        });
        if (existing) {
            return this.prisma.evaluationDraft.update({
                where: { id: existing.id },
                data: { draft: draft as Prisma.InputJsonValue },
            });
        } else {
            return this.prisma.evaluationDraft.create({
                data: { userId, cycleId, draft: draft as Prisma.InputJsonValue },
            });
        }
    }

    async getDraft(userId: number, cycleId: number) {
        return await this.prisma.evaluationDraft.findFirst({
            where: { userId, cycleId },
        });
    }
}
