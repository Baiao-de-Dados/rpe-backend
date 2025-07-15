import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveEqualizationDto } from './dto/save-equalization.dto';

@Injectable()
export class EqualizationService {
    constructor(private readonly prisma: PrismaService) {}

    async saveEqualization(dto: SaveEqualizationDto) {
        const { cycleId, collaboratorId, rating, justification } = dto;

        // Verifica se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({ where: { id: cycleId } });
        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${cycleId} não encontrado.`);
        }

        // Verifica se o colaborador existe
        const collaborator = await this.prisma.user.findUnique({ where: { id: collaboratorId } });
        if (!collaborator) {
            throw new NotFoundException(`Colaborador com ID ${collaboratorId} não encontrado.`);
        }

        // Verifica se já existe uma equalização para este colaborador no ciclo
        const existingEqualization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                evaluation: {
                    cycleConfigId: cycleId,
                },
            },
        });

        if (existingEqualization) {
            throw new BadRequestException(
                `Já existe uma equalização para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        // Busca a avaliação associada ao colaborador e ciclo
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

        // Cria a equalização
        return this.prisma.equalization.create({
            data: {
                evaluationId: evaluation.id,
                collaboratorId,
                justification,
                score: rating,
            },
        });
    }

    async editEqualization(dto: SaveEqualizationDto) {
        const { cycleId, collaboratorId, rating, justification } = dto;

        // Busca a avaliação associada ao colaborador e ciclo
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

        // Busca a equalização existente
        const equalization = await this.prisma.equalization.findFirst({
            where: {
                evaluationId: evaluation.id,
                collaboratorId,
            },
        });

        if (!equalization) {
            throw new NotFoundException(
                `Equalização não encontrada para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        // Atualiza a equalização
        return this.prisma.equalization.update({
            where: { id: equalization.id },
            data: {
                justification,
                score: rating,
            },
        });
    }

    async getEqualization(collaboratorId: number, cycleId: number) {
        // Busca a avaliação associada ao colaborador e ciclo
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: collaboratorId,
                cycleConfigId: cycleId,
            },
            include: {
                equalization: true,
            },
        });

        if (!evaluation || !evaluation.equalization) {
            throw new NotFoundException(
                `Equalização não encontrada para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        return evaluation.equalization;
    }
}
