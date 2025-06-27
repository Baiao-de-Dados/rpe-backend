import { Injectable, BadRequestException } from '@nestjs/common';
import { CycleValidationService } from './cycle-validation.service';

@Injectable()
export class MentorEvaluationService {
    constructor(private cycleValidationService: CycleValidationService) {}

    async createMentorEvaluation(
        prisma: any,
        mentoring: any,
        colaboradorId: number,
        ciclo: string,
    ) {
        if (!mentoring) {
            throw new BadRequestException('Dados de mentoria são obrigatórios');
        }

        if (!mentoring.mentorId) {
            throw new BadRequestException('ID do mentor é obrigatório');
        }

        if (!mentoring.justificativa) {
            throw new BadRequestException('Justificativa do mentor é obrigatória');
        }

        // Validar ciclo ativo e dentro do prazo
        await this.cycleValidationService.validateActiveCycle(prisma, 'MENTOR');

        const mentorEvaluation = await prisma.evaluation.create({
            data: {
                type: 'MENTOR',
                evaluatorId: parseInt(mentoring.mentorId, 10),
                evaluateeId: colaboradorId,
                cycle: parseInt(ciclo.replace(/\D/g, '')),
                justification: mentoring.justificativa,
                score: 0,
            },
        });
        return mentorEvaluation;
    }

    async createMentorEvaluations(
        prisma: any,
        mentoringArray: any[],
        colaboradorId: number,
        ciclo: string,
    ) {
        const mentorEvaluations: any[] = [];

        if (!mentoringArray || mentoringArray.length === 0) {
            throw new BadRequestException('Array de mentoria é obrigatório');
        }

        // Validar ciclo ativo e dentro do prazo
        await this.cycleValidationService.validateActiveCycle(prisma, 'MENTOR/LEADER');

        for (const mentoring of mentoringArray) {
            if (!mentoring) {
                continue;
            }

            // Cria avaliação do mentor
            if (mentoring.mentorId && mentoring.justificativa) {
                const mentorEvaluation = await prisma.evaluation.create({
                    data: {
                        type: 'MENTOR',
                        evaluatorId: parseInt(mentoring.mentorId, 10),
                        evaluateeId: colaboradorId,
                        cycle: parseInt(ciclo.replace(/\D/g, '')),
                        justification: mentoring.justificativa,
                        score: 0,
                    },
                });
                mentorEvaluations.push(mentorEvaluation);
            } else if (mentoring.mentorId && !mentoring.justificativa) {
                throw new BadRequestException('Justificativa do mentor é obrigatória');
            } else if (!mentoring.mentorId && mentoring.justificativa) {
                throw new BadRequestException('ID do mentor é obrigatório');
            }

            // Cria avaliação do líder (se presente)
            if (mentoring.leaderId && mentoring.leaderJustificativa) {
                const leaderEvaluation = await prisma.evaluation.create({
                    data: {
                        type: 'LEADER',
                        evaluatorId: parseInt(mentoring.leaderId, 10),
                        evaluateeId: colaboradorId,
                        cycle: parseInt(ciclo.replace(/\D/g, '')),
                        justification: mentoring.leaderJustificativa,
                        score: 0,
                    },
                });
                mentorEvaluations.push(leaderEvaluation);
            } else if (mentoring.leaderId && !mentoring.leaderJustificativa) {
                throw new BadRequestException('Justificativa do líder é obrigatória');
            }
        }

        return mentorEvaluations;
    }
}
