import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { UpdateCriterionTrackConfigDto } from './dto/update-criterion-track-config.dto';
import { BatchUpdateCriteriaDto } from './dto/batch-update-criteria.dto';
import { TrackConfigDto } from './dto/track-config.dto';

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

    async findAllTrackConfigs() {
        // Buscar todas as configurações de critérios por trilha
        const trackConfigs = await this.prisma.criterionTrackConfig.findMany({
            include: {
                criterion: {
                    include: {
                        pillar: {
                            include: {
                                trackConfigs: true,
                            },
                        },
                    },
                },
            },
        });

        // Organizar dados por trilha
        const tracksMap = new Map();

        // Processar configurações de critérios
        trackConfigs.forEach((config) => {
            const track = config.track;
            const pillar = config.criterion.pillar;
            const criterion = config.criterion;

            if (!tracksMap.has(track)) {
                tracksMap.set(track, {
                    name: track,
                    pillars: new Map(),
                });
            }

            const trackData = tracksMap.get(track);

            if (!trackData.pillars.has(pillar.id)) {
                trackData.pillars.set(pillar.id, {
                    id: pillar.id,
                    name: pillar.name,
                    criteria: [],
                });
            }

            const pillarData = trackData.pillars.get(pillar.id);
            pillarData.criteria.push({
                id: criterion.id,
                name: criterion.name,
                description: criterion.description,
                weight: config.weight,
            });
        });

        // Converter para array e ordenar
        const result = Array.from(tracksMap.values())
            .map((track) => ({
                name: track.name,
                pillars: Array.from(track.pillars.values())
                    .map((pillar: any) => ({
                        id: pillar.id,
                        name: pillar.name,
                        criteria: pillar.criteria.sort((a: any, b: any) =>
                            a.name.localeCompare(b.name),
                        ),
                    }))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name)),
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));

        return result;
    }

    async findTrackConfigsByTrack(track: string) {
        // Buscar todas as configurações de critérios para a trilha específica
        const trackConfigs = await this.prisma.criterionTrackConfig.findMany({
            where: {
                track: track,
                //isActive: true,
            },
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });

        // Organizar dados por trilha > pilares > critérios (mesmo padrão do findAllTrackConfigs)
        const tracksMap = new Map();
        if (!tracksMap.has(track)) {
            tracksMap.set(track, {
                name: track,
                pillars: new Map(),
            });
        }
        const trackData = tracksMap.get(track);

        trackConfigs.forEach((config) => {
            const pillar = config.criterion.pillar;
            const criterion = config.criterion;

            if (!trackData.pillars.has(pillar.id)) {
                trackData.pillars.set(pillar.id, {
                    id: pillar.id,
                    name: pillar.name,
                    criteria: [],
                });
            }

            const pillarData = trackData.pillars.get(pillar.id);
            pillarData.criteria.push({
                id: criterion.id,
                name: criterion.name,
                description: criterion.description,
                weight: config.weight,
            });
        });

        // Converter para array e ordenar
        const result = {
            name: trackData.name,
            pillars: Array.from(trackData.pillars.values())
                .map((pillar: any) => ({
                    id: pillar.id,
                    name: pillar.name,
                    criteria: pillar.criteria.sort((a: any, b: any) =>
                        a.name.localeCompare(b.name),
                    ),
                }))
                .sort((a: any, b: any) => a.name.localeCompare(b.name)),
        };

        return result;
    }

    async findActiveCriteriaForUser(userId: number) {
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

        // Buscar todas as configurações de critérios para a trilha do usuário
        const trackConfigs = await this.prisma.criterionTrackConfig.findMany({
            where: {
                track: user.track,
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

        // Organizar dados por trilha > pilares > critérios (mesmo padrão do findAllTrackConfigs)
        const tracksMap = new Map();
        if (!tracksMap.has(user.track)) {
            tracksMap.set(user.track, {
                name: user.track,
                pillars: new Map(),
            });
        }
        const trackData = tracksMap.get(user.track);

        trackConfigs.forEach((config) => {
            const pillar = config.criterion.pillar;
            const criterion = config.criterion;

            if (!trackData.pillars.has(pillar.id)) {
                trackData.pillars.set(pillar.id, {
                    id: pillar.id,
                    name: pillar.name,
                    criteria: [],
                });
            }

            const pillarData = trackData.pillars.get(pillar.id);
            pillarData.criteria.push({
                id: criterion.id,
                name: criterion.name,
                description: criterion.description,
                weight: config.weight,
            });
        });

        // Converter para array e ordenar
        const result = {
            name: trackData.name,
            pillars: Array.from(trackData.pillars.values())
                .map((pillar: any) => ({
                    id: pillar.id,
                    name: pillar.name,
                    criteria: pillar.criteria.sort((a: any, b: any) =>
                        a.name.localeCompare(b.name),
                    ),
                }))
                .sort((a: any, b: any) => a.name.localeCompare(b.name)),
        };

        return result;
    }

    async updateTrackConfig(
        criterionId: number,
        track: string,
        updateConfigDto: UpdateCriterionTrackConfigDto,
    ) {
        const config = await this.prisma.criterionTrackConfig.findUnique({
            where: {
                criterionId_track: {
                    criterionId,
                    track: track,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de critério não encontrada');
        }

        return await this.prisma.criterionTrackConfig.update({
            where: {
                criterionId_track: {
                    criterionId,
                    track: track,
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

    async removeTrackConfig(criterionId: number, track: string) {
        const config = await this.prisma.criterionTrackConfig.findUnique({
            where: {
                criterionId_track: {
                    criterionId,
                    track: track,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de critério não encontrada');
        }

        return await this.prisma.criterionTrackConfig.delete({
            where: {
                criterionId_track: {
                    criterionId,
                    track: track,
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

    async createTrackConfigBulk(trackConfigs: TrackConfigDto[]) {
        const results: any[] = [];

        for (const trackConfig of trackConfigs) {
            const trackId = trackConfig.track;
            const trackResults = {
                track: trackId,
                pillars: [] as any[],
            };

            for (const pillar of trackConfig.pillars) {
                const pillarResults = {
                    pillar: pillar.id,
                    criteria: [] as any[],
                };

                for (const criterion of pillar.criteria) {
                    // Validar se o ID é um número válido
                    const criterionId = parseInt(criterion.id);
                    if (isNaN(criterionId)) {
                        throw new BadRequestException(
                            `ID do critério "${criterion.id}" não é um número válido. Use o ID numérico do critério.`,
                        );
                    }

                    // Verificar se o critério existe
                    const existingCriterion = await this.prisma.criterion.findUnique({
                        where: { id: criterionId },
                    });

                    if (!existingCriterion) {
                        throw new BadRequestException(
                            `Critério com ID ${criterionId} não encontrado. Verifique se o critério existe.`,
                        );
                    }

                    const config = await this.prisma.criterionTrackConfig.upsert({
                        where: {
                            criterionId_track: {
                                criterionId: criterionId,
                                track: trackId,
                            },
                        },
                        update: {
                            weight: criterion.weight,
                            isActive: true,
                        },
                        create: {
                            criterionId: criterionId,
                            track: trackId,
                            weight: criterion.weight,
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

                    pillarResults.criteria.push({
                        id: criterion.id,
                        weight: criterion.weight,
                        name: config.criterion.name,
                    });
                }

                trackResults.pillars.push(pillarResults);
            }

            results.push(trackResults);
        }

        return {
            message: 'Configurações de trilhas criadas/atualizadas com sucesso',
            data: results,
        };
    }

    private normalizeCriterionName(name: string): string {
        return name
            .trim() // Remove espaços no início e fim
            .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um só
            .toUpperCase(); // Converte para maiúsculas
    }
}
