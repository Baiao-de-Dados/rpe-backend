import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { CreateCriterionTrackConfigDto } from './dto/create-criterion-track-config.dto';
import { UpdateCriterionTrackConfigDto } from './dto/update-criterion-track-config.dto';
import { BatchUpdateCriteriaDto } from './dto/batch-update-criteria.dto';

@Injectable()
export class CriteriaService {
    constructor(private prisma: PrismaService) {}

    async create(createCriterionDto: CreateCriterionDto) {
        // Verificar se já existe um critério com o mesmo nome
        const existingCriterion = await this.prisma.criterion.findFirst({
            where: {
                name: createCriterionDto.name,
            },
        });

        if (existingCriterion) {
            throw new BadRequestException(
                `Já existe um critério com o nome "${createCriterionDto.name}". Nomes de critérios devem ser únicos.`,
            );
        }

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

        // Se está atualizando o nome, verificar se já existe outro critério com o mesmo nome
        if (updateCriterionDto.name) {
            const existingCriterion = await this.prisma.criterion.findFirst({
                where: {
                    name: updateCriterionDto.name,
                    id: { not: id }, // Excluir o critério atual da busca
                },
            });

            if (existingCriterion) {
                throw new BadRequestException(
                    `Já existe um critério com o nome "${updateCriterionDto.name}". Nomes de critérios devem ser únicos.`,
                );
            }
        }

        return this.prisma.criterion.update({
            where: { id },
            data: updateCriterionDto,
            include: {
                pillar: true,
            },
        });
    }

    async remove(id: number) {
        const criterion = await this.findOne(id); // Verifica se existe

        // Verificar se há avaliações associadas
        const evaluationsCount = await this.prisma.criteriaAssignment.count({
            where: { criterionId: id },
        });

        if (evaluationsCount > 0) {
            throw new BadRequestException(
                `Não é possível remover o critério "${criterion.name}" pois existem ${evaluationsCount} avaliação(ões) associada(s). Remova as avaliações primeiro.`,
            );
        }

        // Verificar se há configurações de ciclo associadas
        const cycleConfigsCount = await this.prisma.criterionCycleConfig.count({
            where: { criterionId: id },
        });

        if (cycleConfigsCount > 0) {
            throw new BadRequestException(
                `Não é possível remover o critério "${criterion.name}" pois está configurado em ${cycleConfigsCount} ciclo(s). Remova as configurações de ciclo primeiro.`,
            );
        }

        // Verificar se há configurações de trilha associadas
        const trackConfigsCount = await this.prisma.criterionTrackConfig.count({
            where: { criterionId: id },
        });

        if (trackConfigsCount > 0) {
            throw new BadRequestException(
                `Não é possível remover o critério "${criterion.name}" pois está configurado em ${trackConfigsCount} trilha(s)/cargo(s). Remova as configurações de trilha primeiro.`,
            );
        }

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

    async batchUpdate(batchUpdateDto: BatchUpdateCriteriaDto) {
        // Normalizar os nomes dos critérios
        const normalizedCriteria = batchUpdateDto.criteria.map((criterion) => ({
            ...criterion,
            name: this.normalizeCriterionName(criterion.name),
        }));

        // Verificar se há conflitos de nomes entre os critérios que estão sendo atualizados
        const nameConflicts = new Set();
        for (let i = 0; i < normalizedCriteria.length; i++) {
            const criterion1 = normalizedCriteria[i];

            for (let j = i + 1; j < normalizedCriteria.length; j++) {
                const criterion2 = normalizedCriteria[j];

                // Se dois critérios diferentes terão o mesmo nome após a atualização
                if (criterion1.name === criterion2.name) {
                    nameConflicts.add(criterion1.name);
                }
            }
        }

        // Se há conflitos, lançar erro
        if (nameConflicts.size > 0) {
            const conflictNames = Array.from(nameConflicts).join(', ');
            throw new BadRequestException(
                `Não é possível atualizar critérios com nomes duplicados: ${conflictNames}. Nomes de critérios devem ser únicos.`,
            );
        }

        // Buscar todos os critérios que serão atualizados
        const criteriaToUpdate: any[] = [];
        for (const criterionData of normalizedCriteria) {
            const criterion = await this.prisma.criterion.findUnique({
                where: { id: criterionData.id },
            });

            if (!criterion) {
                throw new BadRequestException(
                    `Critério com ID ${criterionData.id} não encontrado.`,
                );
            }

            criteriaToUpdate.push({
                original: criterion,
                update: criterionData,
            });
        }

        // Verificar se algum nome já existe em outros critérios (não da requisição)
        for (const { original: criterion, update: updateData } of criteriaToUpdate) {
            if (updateData.name !== criterion.name) {
                const existingCriterion = await this.prisma.criterion.findFirst({
                    where: {
                        name: updateData.name,
                        id: {
                            notIn: criteriaToUpdate.map((c) => c.original.id),
                        },
                    },
                });

                if (existingCriterion) {
                    throw new BadRequestException(
                        `Já existe um critério com o nome "${updateData.name}". Nomes de critérios devem ser únicos.`,
                    );
                }
            }
        }

        // Atualizar todos os critérios
        const results: any[] = [];
        for (const { original: criterion, update: updateData } of criteriaToUpdate) {
            const updatedCriterion = await this.prisma.criterion.update({
                where: { id: criterion.id },
                data: {
                    name: updateData.name,
                    description: updateData.description,
                },
                include: {
                    pillar: true,
                },
            });

            results.push(updatedCriterion);
        }

        return results;
    }

    private normalizeCriterionName(name: string): string {
        return name
            .trim() // Remove espaços no início e fim
            .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um só
            .toUpperCase(); // Converte para maiúsculas
    }
}
