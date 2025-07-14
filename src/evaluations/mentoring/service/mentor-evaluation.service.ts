import { Injectable, BadRequestException } from '@nestjs/common';
import { CycleValidationService } from '../../services/cycle-validation.service';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MentorEvaluationService {
    constructor(private cycleValidationService: CycleValidationService) {}

    async createMentorEvaluation(
        prisma: PrismaClient,
        mentorId: number,
        evaluatorId: number,
        justification: string,
        cycleConfigId: number,
    ) {
        if (!mentorId) {
            throw new BadRequestException('ID do mentor é obrigatório');
        }

        if (!justification) {
            throw new BadRequestException('Justificativa do mentor é obrigatória');
        }
        // Validar ciclo ativo e dentro do prazo
        await this.cycleValidationService.validateActiveCycle(prisma, 'MENTOR');

        const mentorEvaluation = await prisma.evaluation.create({
            data: {
                evaluatorId: evaluatorId,
                cycleConfigId: cycleConfigId,
            },
        });

        // Criar o registro de mentoring
        await prisma.mentoring.create({
            data: {
                evaluationId: mentorEvaluation.id,
                mentorId: mentorId,
                justification: justification,
            },
        });

        return mentorEvaluation;
    }
}
