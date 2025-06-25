import { Injectable } from '@nestjs/common';

@Injectable()
export class Peer360EvaluationService {
    async createPeer360Evaluations(
        prisma: any,
        avaliacao360: any[],
        colaboradorId: number,
        ciclo: string,
    ) {
        const peerEvaluations: any[] = [];
        if (avaliacao360 && avaliacao360.length > 0) {
            for (const avaliacao of avaliacao360) {
                const peerEvaluation = await prisma.evaluation.create({
                    data: {
                        type: 'PEER_360',
                        evaluatorId: colaboradorId,
                        evaluateeId: parseInt(avaliacao.avaliadoId, 10),
                        cycle: parseInt(ciclo.replace(/\D/g, '')),
                        justification: avaliacao.justificativa,
                        score: 0,
                    },
                });
                peerEvaluations.push(peerEvaluation);
            }
        }
        return peerEvaluations;
    }
}
