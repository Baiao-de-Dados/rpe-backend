import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
        return await this.prisma.pillarTrackConfig.create({
            data: {
                pillarId: createConfigDto.pillarId,
                track: createConfigDto.track,
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

    async findTrackConfigsByTrack(track: string) {
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
            },
        });
    }

    async findActivePillarsForUser(userId: number) {
        // Buscar o usuário para obter track
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { track: true },
        });

        if (!user) {
            throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
        }

        if (!user.track) {
            throw new BadRequestException(`Usuário com ID ${userId} não possui trilha definida`);
        }

        // Buscar pilares ativos para o usuário baseado em track
        return await this.prisma.pillarTrackConfig.findMany({
            where: {
                track: user.track,
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
        track: string,
        updateConfigDto: UpdatePillarTrackConfigDto,
    ) {
        const config = await this.prisma.pillarTrackConfig.findUnique({
            where: {
                pillarId_track: {
                    pillarId,
                    track: track,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de pilar não encontrada');
        }

        return await this.prisma.pillarTrackConfig.update({
            where: {
                pillarId_track: {
                    pillarId,
                    track: track,
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

    async removeTrackConfig(pillarId: number, track: string) {
        const config = await this.prisma.pillarTrackConfig.findUnique({
            where: {
                pillarId_track: {
                    pillarId,
                    track: track,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de pilar não encontrada');
        }

        return await this.prisma.pillarTrackConfig.delete({
            where: {
                pillarId_track: {
                    pillarId,
                    track: track,
                },
            },
        });
    }
}
