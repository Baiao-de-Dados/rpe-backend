import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
                evaluatorId: collaboratorId,
                cycleConfigId: cycleId,
            },
            include: {
                autoEvaluation: {
                    include: { assignments: true },
                },
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
        });

        if (!evaluation) {
            throw new NotFoundException('Avaliação não encontrada');
        }

        // Verifica se já existe uma equalização para esta avaliação
        const existingEqualization = await this.prisma.equalization.findFirst({
            where: { evaluationId: evaluation.id },
        });

        if (existingEqualization) {
            throw new BadRequestException(
                `Já existe uma equalização para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        // Criar equalização
        const equalization = await this.prisma.equalization.create({
            data: {
                evaluationId: evaluation.id,
                justification: justification,
                score: rating,
            },
        });

        return equalization;
    }

    async editEqualization(dto: SaveEqualizationDto) {
        const { cycleId, collaboratorId, rating, justification } = dto;

        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: collaboratorId,
                cycleConfigId: cycleId,
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

    async getEqualization(collaboratorId: number, cycleId: number) {
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: collaboratorId,
                cycleConfigId: cycleId,
            },
            include: {
                equalization: true,
            },
        });

        if (!evaluation) {
            throw new NotFoundException('Avaliação não encontrada');
        }

        return evaluation.equalization;
    }
}
