import { Injectable, BadRequestException } from '@nestjs/common';
import { CycleValidationService } from '../../services/cycle-validation.service';
import { PrismaClient, Evaluation } from '@prisma/client';

@Injectable()
export class Peer360EvaluationService {
    constructor(private cycleValidationService: CycleValidationService) {}

    async createPeer360Evaluations(
        prisma: PrismaClient,
        avaliacao360: Array<{
            avaliadoId: number;
            pontosFortes: string;
            pontosMelhoria: string;
            score: number;
        }>,
        colaboradorId: number,
        cycleConfigId: number,
    ): Promise<Evaluation[]> {
        const peerEvaluations: Evaluation[] = [];

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

            if (!avaliacao.pontosFortes || !avaliacao.pontosMelhoria) {
                throw new BadRequestException(
                    'Pontos fortes e pontos de melhoria são obrigatórios',
                );
            }

            const peerEvaluation = await prisma.evaluation.create({
                data: {
                    evaluatorId: colaboradorId,
                    cycleConfigId: cycleConfigId,
                },
            });

            await prisma.evaluation360.create({
                data: {
                    evaluationId: peerEvaluation.id,
                    evaluatedId: avaliacao.avaliadoId,
                    strengths: avaliacao.pontosFortes ?? '',
                    improvements: avaliacao.pontosMelhoria ?? '',
                    score: avaliacao.score ?? 0,
                },
            });

            peerEvaluations.push(peerEvaluation);
        }

        return peerEvaluations;
    }
}
