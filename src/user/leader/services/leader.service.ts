import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LeaderEvaluationDto } from '../dto/leader-evaluation.dto';

@Injectable()
export class LeaderService {
    constructor(private readonly prisma: PrismaService) {}

    async evaluate(dto: LeaderEvaluationDto) {
        const {
            cycleId,
            collaboratorId,
            leaderId,
            generalRating,
            generalJustification,
            strengths,
            improvements,
        } = dto;

        //Verificar se existe assignment para esse líder/colaborador/ciclo
        const assignment = await this.prisma.leaderEvaluationAssignment.findFirst({
            where: {
                cycleId,
                collaboratorId,
                leaderId,
            },
        });
        if (!assignment) {
            throw new BadRequestException(
                'Você não tem permissão para avaliar este colaborador neste ciclo.',
            );
        }

        //Verificar se já existe avaliação
        const existing = await this.prisma.leaderEvaluation.findFirst({
            where: {
                cycleId,
                collaboratorId,
                leaderId,
            },
        });

        if (existing) {
            // Atualizar avaliação existente
            return this.prisma.leaderEvaluation.update({
                where: { id: existing.id },
                data: {
                    score: generalRating,
                    justification: generalJustification,
                    strengths,
                    improvements,
                },
            });
        } else {
            // Criar nova avaliação
            return this.prisma.leaderEvaluation.create({
                data: {
                    cycleId,
                    collaboratorId,
                    leaderId,
                    score: generalRating,
                    justification: generalJustification,
                    strengths,
                    improvements,
                },
            });
        }
    }
}
