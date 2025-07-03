import { Injectable, BadRequestException } from '@nestjs/common';
import { CycleValidationService } from './cycle-validation.service';

@Injectable()
export class Peer360EvaluationService {
    constructor(private cycleValidationService: CycleValidationService) {}

    async createPeer360Evaluations(
        prisma: any,
        avaliacao360: any[],
        colaboradorId: number,
        cycleConfigId: number,
    ) {
        const peerEvaluations: any[] = [];

        if (!avaliacao360 || avaliacao360.length === 0) {
            throw new BadRequestException('Avaliações 360 são obrigatórias');
        }

        // Validar ciclo ativo e dentro do prazo
        await this.cycleValidationService.validateActiveCycle(prisma, 'PEER_360');

        for (const avaliacao of avaliacao360) {
            if (!avaliacao) {
                throw new BadRequestException('Avaliação 360 inválida');
            }

            if (!avaliacao.avaliadoId) {
                throw new BadRequestException('ID do avaliado é obrigatório');
            }

            if (!avaliacao.justificativa) {
                throw new BadRequestException('Justificativa é obrigatória');
            }

            const peerEvaluation = await prisma.evaluation.create({
                data: {
                    type: 'PEER_360',
                    evaluatorId: colaboradorId,
                    evaluateeId: avaliacao.avaliadoId,
                    cycleConfigId: cycleConfigId,
                    justification: avaliacao.justificativa,
                    score: 0,
                },
            });
            peerEvaluations.push(peerEvaluation);
        }

        return peerEvaluations;
    }
}
