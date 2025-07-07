import { Injectable, BadRequestException } from '@nestjs/common';
import { CycleValidationService } from './cycle-validation.service';

@Injectable()
export class MentorEvaluationService {
    constructor(private cycleValidationService: CycleValidationService) {}

    async createMentorEvaluation(
        prisma: any,
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
                evaluateeId: mentorId,
                cycleConfigId: cycleConfigId,
            },
        });

        // Criar o registro de mentoring
        await prisma.mentoring.create({
            data: {
                evaluationId: mentorEvaluation.id,
                justification: justification,
            },
        });

        return mentorEvaluation;
    }
}
