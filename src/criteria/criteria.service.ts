import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { CreateCriterionTrackConfigDto } from './dto/create-criterion-track-config.dto';
import { UpdateCriterionTrackConfigDto } from './dto/update-criterion-track-config.dto';

@Injectable()
export class CriteriaService {
    constructor(private prisma: PrismaService) {}

    async create(createCriterionDto: CreateCriterionDto) {
        return this.prisma.criterion.create({
            data: createCriterionDto,
            include: {
                pillar: true,
            },
        });
    }

    async findAll() {
        return this.prisma.criterion.findMany({
            include: {
                pillar: true,
            },
        });
    }

    async findOne(id: number) {
        const criterion = await this.prisma.criterion.findUnique({
            where: { id },
            include: {
                pillar: true,
            },
        });

        if (!criterion) {
            throw new NotFoundException(`Critério com ID ${id} não encontrado`);
        }

        return criterion;
    }

    async update(id: number, updateCriterionDto: UpdateCriterionDto) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.criterion.update({
            where: { id },
            data: updateCriterionDto,
            include: {
                pillar: true,
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.criterion.delete({
            where: { id },
        });
    }

    async findByPillar(pillarId: number) {
        return this.prisma.criterion.findMany({
            where: { pillarId },
            include: {
                pillar: true,
            },
        });
    }

    // Métodos para configuração de critérios por trilha e cargo
    async createTrackConfig(createConfigDto: CreateCriterionTrackConfigDto) {
        return await this.prisma.criterionTrackConfig.create({
            data: {
                criterionId: createConfigDto.criterionId,
                track: createConfigDto.track,
                position: createConfigDto.position,
                isActive: createConfigDto.isActive ?? true,
                weight: createConfigDto.weight ?? 1.0,
            },
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });
    }

    async findAllTrackConfigs() {
        return await this.prisma.criterionTrackConfig.findMany({
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });
    }

    async findTrackConfigsByTrackAndPosition(track?: string, position?: string) {
        return await this.prisma.criterionTrackConfig.findMany({
            where: {
                track: track || null,
                position: position || null,
                isActive: true,
            },
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });
    }

    async findActiveCriteriaForUser(userId: number) {
        // Buscar o usuário para obter track e position
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { track: true, position: true },
        });

        if (!user) {
            throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
        }

        // Buscar critérios ativos para o usuário baseado em track e position
        return this.prisma.criterionTrackConfig.findMany({
            where: {
                track: user.track || null,
                position: user.position || null,
                isActive: true,
            },
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });
    }

    async updateTrackConfig(
        criterionId: number,
        track: string | null,
        position: string | null,
        updateConfigDto: UpdateCriterionTrackConfigDto,
    ) {
        const config = await this.prisma.criterionTrackConfig.findUnique({
            where: {
                criterionId_track_position: {
                    criterionId,
                    track: track as any,
                    position: position as any,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de critério não encontrada');
        }

        return await this.prisma.criterionTrackConfig.update({
            where: {
                criterionId_track_position: {
                    criterionId,
                    track: track as any,
                    position: position as any,
                },
            },
            data: updateConfigDto,
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });
    }

    async removeTrackConfig(criterionId: number, track: string | null, position: string | null) {
        const config = await this.prisma.criterionTrackConfig.findUnique({
            where: {
                criterionId_track_position: {
                    criterionId,
                    track: track as any,
                    position: position as any,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de critério não encontrada');
        }

        return await this.prisma.criterionTrackConfig.delete({
            where: {
                criterionId_track_position: {
                    criterionId,
                    track: track as any,
                    position: position as any,
                },
            },
        });
    }
}
