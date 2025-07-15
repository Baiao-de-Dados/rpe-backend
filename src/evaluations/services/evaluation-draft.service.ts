import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EvaluationDraftService {
    constructor(private readonly prisma: PrismaService) {}

    async saveDraft(userId: number, cycleId: number, draft: any) {
        // Validação manual da estrutura do draft
        if (!draft || typeof draft !== 'object') {
            throw new BadRequestException('Draft deve ser um objeto');
        }

        // Validar selfAssessment
        if (draft.selfAssessment && Array.isArray(draft.selfAssessment)) {
            for (const item of draft.selfAssessment) {
                if (typeof item.pillarId !== 'number' || typeof item.criteriaId !== 'number') {
                    throw new BadRequestException(
                        'selfAssessment: pillarId e criteriaId devem ser números',
                    );
                }
            }
        }

        // Validar evaluation360
        if (draft.evaluation360 && Array.isArray(draft.evaluation360)) {
            for (const item of draft.evaluation360) {
                if (typeof item.evaluateeId !== 'number') {
                    throw new BadRequestException('evaluation360: evaluateeId deve ser número');
                }
            }
        }

        // Validar mentoring
        if (draft.mentoring && Array.isArray(draft.mentoring)) {
            for (const item of draft.mentoring) {
                if (typeof item.rating !== 'number') {
                    throw new BadRequestException('mentoring: rating deve ser número');
                }
            }
        }

        // Validar references
        if (draft.references && Array.isArray(draft.references)) {
            for (const item of draft.references) {
                if (typeof item.collaboratorId !== 'number') {
                    throw new BadRequestException('references: collaboratorId deve ser número');
                }
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
