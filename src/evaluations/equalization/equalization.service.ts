import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveEqualizationDto } from './dto/save-equalization.dto';

@Injectable()
export class EqualizationService {
    constructor(private readonly prisma: PrismaService) {}

    async saveEqualization(dto: SaveEqualizationDto) {
        const { cycleId, collaboratorId, rating, justification } = dto;

        const cycle = await this.prisma.cycleConfig.findUnique({ where: { id: cycleId } });
        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${cycleId} não encontrado.`);
        }

        const collaborator = await this.prisma.user.findUnique({ where: { id: collaboratorId } });
        if (!collaborator) {
            throw new NotFoundException(`Colaborador com ID ${collaboratorId} não encontrado.`);
        }

        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                cycleConfigId: cycleId,
                evaluateeId: collaboratorId,
            },
        });

        if (!evaluation) {
            throw new NotFoundException(
                `Avaliação não encontrada para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        return this.prisma.equalization.create({
            data: {
                evaluationId: evaluation.id,
                justification,
                score: rating,
            },
        });
    }

    async editEqualization(dto: SaveEqualizationDto) {
        const { cycleId, collaboratorId, rating, justification } = dto;

        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                cycleConfigId: cycleId,
                evaluateeId: collaboratorId,
            },
        });

        if (!evaluation) {
            throw new NotFoundException(
                `Avaliação não encontrada para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        const equalization = await this.prisma.equalization.findFirst({
            where: { evaluationId: evaluation.id },
        });

        if (!equalization) {
            throw new NotFoundException(
                `Equalização não encontrada para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        return this.prisma.equalization.update({
            where: { id: equalization.id },
            data: {
                justification,
                score: rating,
            },
        });
    }
}
