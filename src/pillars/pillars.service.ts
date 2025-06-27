import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';
import { CreatePillarTrackConfigDto } from './dto/create-pillar-track-config.dto';
import { UpdatePillarTrackConfigDto } from './dto/update-pillar-track-config.dto';

@Injectable()
export class PillarsService {
    constructor(private prisma: PrismaService) {}

    async create(createPillarDto: CreatePillarDto) {
        return this.prisma.pillar.create({
            data: createPillarDto,
            include: {
                criteria: true,
            },
        });
    }

    async findAll() {
        return this.prisma.pillar.findMany({
            include: {
                criteria: true,
            },
        });
    }

    async findOne(id: number) {
        const pillar = await this.prisma.pillar.findUnique({
            where: { id },
            include: {
                criteria: true,
            },
        });

        if (!pillar) {
            throw new NotFoundException(`Pilar com ID ${id} não encontrado`);
        }

        return pillar;
    }

    async update(id: number, updatePillarDto: UpdatePillarDto) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.pillar.update({
            where: { id },
            data: updatePillarDto,
            include: {
                criteria: true,
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.pillar.delete({
            where: { id },
        });
    }

    // Métodos para configuração de pilares por trilha e cargo
    async createTrackConfig(createConfigDto: CreatePillarTrackConfigDto) {
        return await this.prisma.pillarTrackConfig.create({
            data: {
                pillarId: createConfigDto.pillarId,
                track: createConfigDto.track,
                position: createConfigDto.position,
                isActive: createConfigDto.isActive ?? true,
            },
            include: {
                pillar: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });
    }

    async findAllTrackConfigs() {
        return await this.prisma.pillarTrackConfig.findMany({
            include: {
                pillar: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });
    }

    async findTrackConfigsByTrackAndPosition(track?: string, position?: string) {
        return await this.prisma.pillarTrackConfig.findMany({
            where: {
                track: track || null,
                position: position || null,
                isActive: true,
            },
            include: {
                pillar: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });
    }

    async findActivePillarsForUser(userId: number) {
        // Buscar o usuário para obter track e position
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { track: true, position: true },
        });

        if (!user) {
            throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
        }

        // Buscar pilares ativos para o usuário baseado em track e position
        return await this.prisma.pillarTrackConfig.findMany({
            where: {
                track: user.track || null,
                position: user.position || null,
                isActive: true,
            },
            include: {
                pillar: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });
    }

    async updateTrackConfig(
        pillarId: number,
        track: string | null,
        position: string | null,
        updateConfigDto: UpdatePillarTrackConfigDto,
    ) {
        const config = await this.prisma.pillarTrackConfig.findUnique({
            where: {
                pillarId_track_position: {
                    pillarId,
                    track: track as any,
                    position: position as any,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de pilar não encontrada');
        }

        return await this.prisma.pillarTrackConfig.update({
            where: {
                pillarId_track_position: {
                    pillarId,
                    track: track as any,
                    position: position as any,
                },
            },
            data: updateConfigDto,
            include: {
                pillar: {
                    include: {
                        criteria: true,
                    },
                },
            },
        });
    }

    async removeTrackConfig(pillarId: number, track: string | null, position: string | null) {
        const config = await this.prisma.pillarTrackConfig.findUnique({
            where: {
                pillarId_track_position: {
                    pillarId,
                    track: track as any,
                    position: position as any,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de pilar não encontrada');
        }

        return await this.prisma.pillarTrackConfig.delete({
            where: {
                pillarId_track_position: {
                    pillarId,
                    track: track as any,
                    position: position as any,
                },
            },
        });
    }
}
