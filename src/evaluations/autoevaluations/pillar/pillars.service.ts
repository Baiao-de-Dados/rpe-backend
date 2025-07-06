import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';
import { CreatePillarTrackConfigDto } from './dto/create-pillar-track-config.dto';
import { UpdatePillarTrackConfigDto } from './dto/update-pillar-track-config.dto';

@Injectable()
export class PillarsService {
    constructor(private prisma: PrismaService) {}

    async create(createPillarDto: CreatePillarDto) {
        // Verificar se já existe um pilar com o mesmo nome
        const existingPillar = await this.prisma.pillar.findFirst({
            where: {
                name: createPillarDto.name,
            },
        });

        if (existingPillar) {
            throw new BadRequestException(
                `Já existe um pilar com o nome "${createPillarDto.name}". Nomes de pilares devem ser únicos.`,
            );
        }

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

        // Se está atualizando o nome, verificar se já existe outro pilar com o mesmo nome
        if (updatePillarDto.name) {
            const existingPillar = await this.prisma.pillar.findFirst({
                where: {
                    name: updatePillarDto.name,
                    id: { not: id }, // Excluir o pilar atual da busca
                },
            });

            if (existingPillar) {
                throw new BadRequestException(
                    `Já existe um pilar com o nome "${updatePillarDto.name}". Nomes de pilares devem ser únicos.`,
                );
            }
        }

        return this.prisma.pillar.update({
            where: { id },
            data: updatePillarDto,
            include: {
                criteria: true,
            },
        });
    }

    async remove(id: number) {
        const pillar = await this.findOne(id); // Verifica se existe

        // Verificar se há critérios associados
        const criteriaCount = await this.prisma.criterion.count({
            where: { pillarId: id },
        });

        if (criteriaCount > 0) {
            throw new BadRequestException(
                `Não é possível remover o pilar "${pillar.name}" pois possui ${criteriaCount} critério(s) associado(s). Remova os critérios primeiro.`,
            );
        }

        // Verificar se há configurações de ciclo associadas
        const cycleConfigsCount = await this.prisma.pillarCycleConfig.count({
            where: { pillarId: id },
        });

        if (cycleConfigsCount > 0) {
            throw new BadRequestException(
                `Não é possível remover o pilar "${pillar.name}" pois está configurado em ${cycleConfigsCount} ciclo(s). Remova as configurações de ciclo primeiro.`,
            );
        }

        // Verificar se há configurações de trilha associadas
        const trackConfigsCount = await this.prisma.pillarTrackConfig.count({
            where: { pillarId: id },
        });

        if (trackConfigsCount > 0) {
            throw new BadRequestException(
                `Não é possível remover o pilar "${pillar.name}" pois está configurado em ${trackConfigsCount} trilha(s). Remova as configurações de trilha primeiro.`,
            );
        }

        return this.prisma.pillar.delete({
            where: { id },
        });
    }

    // Métodos para configuração de pilares por trilha
    async createTrackConfig(createConfigDto: CreatePillarTrackConfigDto) {
        // Busca o trackId pelo nome da trilha
        const track = await this.prisma.track.findUnique({
            where: { name: createConfigDto.track },
        });
        if (!track) {
            throw new NotFoundException(`Trilha "${createConfigDto.track}" não encontrada`);
        }

        const existing = await this.prisma.pillarTrackConfig.findUnique({
            where: {
                pillarId_trackId: {
                    pillarId: createConfigDto.pillarId,
                    trackId: track.id,
                },
            },
        });

        if (existing) {
            // Alterna o isActive (toggle)
            return this.prisma.pillarTrackConfig.update({
                where: {
                    pillarId_trackId: {
                        pillarId: createConfigDto.pillarId,
                        trackId: track.id,
                    },
                },
                data: {
                    isActive: !existing.isActive,
                },
                include: {
                    pillar: {
                        include: { criteria: true },
                    },
                    track: true,
                },
            });
        }

        // Cria normalmente
        return this.prisma.pillarTrackConfig.create({
            data: {
                pillarId: createConfigDto.pillarId,
                trackId: track.id,
                isActive: createConfigDto.isActive ?? true,
            },
            include: {
                pillar: {
                    include: { criteria: true },
                },
                track: true,
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
                track: true,
            },
        });
    }

    async findTrackConfigsByTrack(trackName: string) {
        const track = await this.prisma.track.findUnique({
            where: { name: trackName },
        });
        if (!track) {
            throw new NotFoundException(`Trilha "${trackName}" não encontrada`);
        }
        return await this.prisma.pillarTrackConfig.findMany({
            where: {
                track: track,
                isActive: true,
            },
            include: {
                pillar: {
                    include: {
                        criteria: true,
                    },
                },
                track: true,
            },
        });
    }

    async findActivePillarsForUser(userId: number) {
        // Buscar o usuário para obter trackId
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { trackId: true },
        });

        if (!user) {
            throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
        }

        if (!user.trackId) {
            throw new BadRequestException(`Usuário com ID ${userId} não possui trilha definida`);
        }

        // Buscar o nome da trilha
        const track = await this.prisma.track.findUnique({ where: { id: user.trackId } });
        if (!track) {
            throw new NotFoundException(`Trilha com ID ${user.trackId} não encontrada`);
        }

        // Buscar pilares ativos para o usuário baseado em track (string)
        return await this.prisma.pillarTrackConfig.findMany({
            where: {
                trackId: user.trackId,
                isActive: true,
            },
            include: {
                pillar: {
                    include: {
                        criteria: true,
                    },
                },
                track: true,
            },
        });
    }

    async updateTrackConfig(
        pillarId: number,
        trackName: string,
        updateConfigDto: UpdatePillarTrackConfigDto,
    ) {
        const track = await this.prisma.track.findUnique({
            where: { name: trackName },
        });
        if (!track) {
            throw new NotFoundException(`Trilha "${trackName}" não encontrada`);
        }

        const config = await this.prisma.pillarTrackConfig.findUnique({
            where: {
                pillarId_trackId: {
                    pillarId,
                    trackId: track.id,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de pilar não encontrada');
        }

        const updateData: Partial<Omit<UpdatePillarTrackConfigDto, 'pillarId' | 'track'>> = {};
        if (typeof updateConfigDto.isActive === 'boolean') {
            updateData.isActive = updateConfigDto.isActive;
        }

        return await this.prisma.pillarTrackConfig.update({
            where: {
                pillarId_trackId: {
                    pillarId,
                    trackId: track.id,
                },
            },
            data: updateData,
            include: {
                pillar: {
                    include: {
                        criteria: true,
                    },
                },
                track: true,
            },
        });
    }

    async removeTrackConfig(pillarId: number, trackName: string) {
        const track = await this.prisma.track.findUnique({
            where: { name: trackName },
        });
        if (!track) {
            throw new NotFoundException(`Trilha "${trackName}" não encontrada`);
        }

        const config = await this.prisma.pillarTrackConfig.findUnique({
            where: {
                pillarId_trackId: {
                    pillarId,
                    trackId: track.id,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de pilar não encontrada');
        }

        return await this.prisma.pillarTrackConfig.delete({
            where: {
                pillarId_trackId: {
                    pillarId,
                    trackId: track.id,
                },
            },
        });
    }
}
