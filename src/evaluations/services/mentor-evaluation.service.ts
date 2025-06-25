import { Injectable } from '@nestjs/common';

@Injectable()
export class MentorEvaluationService {
    async createMentorEvaluation(
        prisma: any,
        mentoring: any,
        colaboradorId: number,
        ciclo: string,
    ) {
        if (mentoring) {
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
        return null;
    }

    async createMentorEvaluations(
        prisma: any,
        mentoringArray: any[],
        colaboradorId: number,
        ciclo: string,
    ) {
        const mentorEvaluations: any[] = [];

        for (const mentoring of mentoringArray) {
            if (mentoring) {
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
                }
            }
        }

        return mentorEvaluations;
    }
}
