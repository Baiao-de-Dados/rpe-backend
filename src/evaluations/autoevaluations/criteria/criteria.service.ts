import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { UpdateCriterionTrackConfigDto } from './dto/update-criterion-track-config.dto';
import { BatchUpdateCriteriaDto } from './dto/batch-update-criteria.dto';
import { TrackConfigDto } from './dto/track-config.dto';
import { CycleConfigService } from '../cycle-config/cycle-config.service';

@Injectable()
export class CriteriaService {
    constructor(
        private prisma: PrismaService,
        private cycleConfigService: CycleConfigService,
    ) {}

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
        const criteria = await this.prisma.criterion.findMany({
            include: {
                pillar: true,
            },
        });
        return criteria.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            pillarId: c.pillarId,
        }));
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

        return {
            id: criterion.id,
            name: criterion.name,
            description: criterion.description,
            pillarId: criterion.pillarId,
        };
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
        const evaluationsCount = await this.prisma.autoEvaluationAssignment.count({
            where: { criterionId: id },
        });

        if (evaluationsCount > 0) {
            throw new BadRequestException(
                `Não é possível remover o critério "${criterion.name}" pois existem ${evaluationsCount} avaliação(ões) associada(s). Remova as avaliações primeiro.`,
            );
        }

        // Verificar se há configurações de trilha associadas
        const trackConfigsCount = await this.prisma.criterionTrackCycleConfig.count({
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
        const criteria = await this.prisma.criterion.findMany({
            where: { pillarId },
            include: {
                pillar: true,
            },
        });
        return criteria.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            pillarId: c.pillarId,
        }));
    }

    async findAllTrackConfigs() {
        // Buscar todas as configurações de critérios por trilha (rascunho)
        const trackConfigs = await this.prisma.criterionTrackConfig.findMany({
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
                track: true,
            },
        });

        // Organizar dados por trilha
        const tracksMap = new Map();

        // Processar configurações de critérios
        trackConfigs.forEach((config) => {
            const trackId = config.trackId;
            const trackName = config.track?.name || '';
            const pillar = config.criterion.pillar;
            const criterion = config.criterion;

            if (!tracksMap.has(trackId)) {
                tracksMap.set(trackId, {
                    id: trackId,
                    name: trackName,
                    pillars: new Map(),
                });
            }

            const trackData = tracksMap.get(trackId);

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
                id: track.id,
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

    async findTrackConfigsByTrack(trackId: number) {
        // Buscar configurações de critérios para a trilha específica (rascunho)
        const track = await this.prisma.track.findUnique({
            where: { id: trackId },
            include: {
                criterionTrackConfigs: {
                    include: {
                        criterion: {
                            include: {
                                pillar: true,
                            },
                        },
                    },
                },
            },
        });
        if (!track) {
            throw new NotFoundException(`Trilha com ID ${trackId} não encontrada`);
        }

        // Organizar dados por pilar
        const pillarsMap = new Map();
        track.criterionTrackConfigs.forEach((config) => {
            const pillar = config.criterion.pillar;
            const criterion = config.criterion;

            if (!pillarsMap.has(pillar.id)) {
                pillarsMap.set(pillar.id, {
                    id: pillar.id,
                    name: pillar.name,
                    criteria: [],
                });
            }

            const pillarData = pillarsMap.get(pillar.id);
            pillarData.criteria.push({
                id: criterion.id,
                name: criterion.name,
                description: criterion.description,
                weight: config.weight,
            });
        });

        // Converter para array e ordenar
        const result = {
            id: track.id,
            name: track.name,
            pillars: Array.from(pillarsMap.values())
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
        // Buscar o usuário e sua trilha
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { track: true },
        });

        if (!user || !user.track) {
            throw new NotFoundException('Usuário ou trilha não encontrada');
        }

        // Buscar o ciclo ativo
        const activeCycle = await this.cycleConfigService.getActiveCycle();

        if (!activeCycle) {
            return [];
        }

        // Buscar configurações de critério ativas para a trilha do usuário no ciclo ativo
        const userTrackCriteria = await this.prisma.criterionTrackCycleConfig.findMany({
            where: {
                trackId: user.trackId,
                cycleId: activeCycle.id,
            },
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });

        // Agrupar por pilar
        const pillarsMap = new Map();
        userTrackCriteria.forEach((config) => {
            const pillar = config.criterion.pillar;
            const criterion = config.criterion;

            if (!pillarsMap.has(pillar.id)) {
                pillarsMap.set(pillar.id, {
                    id: pillar.id,
                    name: pillar.name,
                    criteria: [],
                });
            }

            const pillarData = pillarsMap.get(pillar.id);
            pillarData.criteria.push({
                id: criterion.id,
                name: criterion.name,
                description: criterion.description,
                weight: config.weight,
            });
        });

        // Montar objeto de trilha
        const result = {
            id: user.track.id,
            name: user.track.name,
            pillars: Array.from(pillarsMap.values())
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
        trackId: number,
        updateConfigDto: UpdateCriterionTrackConfigDto,
    ) {
        const config = await this.prisma.criterionTrackConfig.findUnique({
            where: {
                criterionId_trackId: {
                    criterionId,
                    trackId,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de critério não encontrada');
        }

        return await this.prisma.criterionTrackConfig.update({
            where: {
                criterionId_trackId: {
                    criterionId,
                    trackId,
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

    async removeTrackConfig(criterionId: number, trackId: number) {
        const config = await this.prisma.criterionTrackConfig.findUnique({
            where: {
                criterionId_trackId: {
                    criterionId,
                    trackId,
                },
            },
        });

        if (!config) {
            throw new NotFoundException('Configuração de critério não encontrada');
        }

        return await this.prisma.criterionTrackConfig.delete({
            where: {
                criterionId_trackId: {
                    criterionId,
                    trackId,
                },
            },
        });
    }

    async batchUpdate(batchUpdateDto: BatchUpdateCriteriaDto) {
        // Normalizar os nomes dos critérios apenas para verificação
        const normalizedCriteria = batchUpdateDto.criteria.map((criterion) => ({
            ...criterion,
            normalizedName: this.normalizeCriterionName(criterion.name),
        }));

        // Verificar se há conflitos de nomes entre os critérios que estão sendo atualizados
        const nameConflicts = new Set();
        for (let i = 0; i < normalizedCriteria.length; i++) {
            const criterion1 = normalizedCriteria[i];

            for (let j = i + 1; j < normalizedCriteria.length; j++) {
                const criterion2 = normalizedCriteria[j];

                // Se dois critérios diferentes terão o mesmo nome após a atualização (normalizado)
                if (criterion1.normalizedName === criterion2.normalizedName) {
                    nameConflicts.add(criterion1.normalizedName);
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
            if (
                this.normalizeCriterionName(updateData.name) !==
                this.normalizeCriterionName(criterion.name)
            ) {
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
                    name: updateData.name, // Salva o nome original, não o normalizado
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
            const trackId = trackConfig.trackId;
            const track = await this.prisma.track.findUnique({ where: { id: trackId } });
            if (!track) {
                throw new BadRequestException(`Trilha com ID ${trackId} não encontrada.`);
            }

            // Remover todas as configurações antigas da trilha antes de inserir as novas
            await this.prisma.criterionTrackConfig.deleteMany({
                where: { trackId: trackId },
            });

            const trackResults = {
                track: trackId,
                pillars: [] as any[],
            };

            for (const pillar of trackConfig.pillars) {
                const pillarId = pillar.id;
                const pillarResults = {
                    pillar: pillarId,
                    criteria: [] as any[],
                };

                for (const criterion of pillar.criteria) {
                    const criterionId = criterion.id;
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
                            criterionId_trackId: {
                                criterionId: criterionId,
                                trackId: trackId,
                            },
                        },
                        update: {
                            weight: criterion.weight,
                        },
                        create: {
                            criterionId: criterionId,
                            trackId: trackId,
                            weight: criterion.weight,
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
                        id: criterionId,
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

    async getCycleHistory(cycleId: number) {
        // Verificar se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleId },
        });

        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${cycleId} não encontrado`);
        }

        // Buscar todas as trilhas e pilares
        const tracks = await this.prisma.track.findMany();
        const pillars = await this.prisma.pillar.findMany();

        // Buscar configurações de critério por trilha para o ciclo
        const cycleConfigs = await this.prisma.criterionTrackCycleConfig.findMany({
            where: { cycleId },
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
                track: true,
            },
        });

        // Organizar dados por trilha e pilar
        const result = tracks.map((track) => ({
            id: track.id,
            name: track.name,
            pillars: pillars.map((pillar) => {
                const criteria = cycleConfigs
                    .filter(
                        (cfg) => cfg.trackId === track.id && cfg.criterion.pillarId === pillar.id,
                    )
                    .map((cfg) => ({
                        id: cfg.criterion.id,
                        name: cfg.criterion.name,
                        description: cfg.criterion.description,
                        weight: cfg.weight,
                    }));
                return {
                    id: pillar.id,
                    name: pillar.name,
                    criteria,
                };
            }),
        }));

        return {
            cycle: {
                id: cycle.id,
                name: cycle.name,
                startDate: cycle.startDate,
                endDate: cycle.endDate,
            },
            tracks: result,
        };
    }

    async createTrackCycleConfigFromDraft(endDate: string) {
        // 1. Buscar todas as configs de rascunho
        const draftConfigs = await this.prisma.criterionTrackConfig.findMany();

        // 2. Impede iniciar ciclo se não houver configs de rascunho
        if (draftConfigs.length === 0) {
            throw new Error(
                'Não é possível iniciar o ciclo: nenhuma configuração de critério encontrada.',
            );
        }

        // 3. Desativar ciclos ativos
        await this.prisma.cycleConfig.updateMany({
            where: { isActive: true },
            data: { isActive: false },
        });

        // Usar a data atual como data de início do ciclo
        const startDate = new Date(); // Data de criação

        const year = startDate.getFullYear();
        const semester = startDate.getMonth() < 6 ? 1 : 2;
        const cycleName = `${year}.${semester}`;

        let cycle = await this.prisma.cycleConfig.findFirst({
            where: {
                OR: [{ startDate: startDate }, { name: cycleName }],
            },
        });

        if (cycle) {
            // Atualiza ciclo existente
            cycle = await this.prisma.cycleConfig.update({
                where: { id: cycle.id },
                data: {
                    endDate: new Date(endDate),
                    name: cycleName, // Garante que o nome está correto
                    startDate: startDate,
                    isActive: true, // Garante que o ciclo atualizado fique ativo
                },
            });
            // Remove configs antigas desse ciclo
            await this.prisma.criterionTrackCycleConfig.deleteMany({
                where: { cycleId: cycle.id },
            });
        } else {
            // Cria novo ciclo
            cycle = await this.prisma.cycleConfig.create({
                data: {
                    name: cycleName,
                    description: 'Ciclo criado automaticamente ao iniciar ciclo',
                    startDate: startDate,
                    endDate: new Date(endDate),
                    isActive: true, // Garante que o ciclo criado é ativo
                },
            });
        }

        // 4. Copiar para CriterionTrackCycleConfig
        if (draftConfigs.length > 0) {
            await this.prisma.criterionTrackCycleConfig.createMany({
                data: draftConfigs.map((config) => ({
                    cycleId: cycle.id,
                    trackId: config.trackId,
                    criterionId: config.criterionId,
                    weight: config.weight,
                })),
            });
        }

        // (Opcional) Limpar o rascunho após iniciar ciclo
        // await this.prisma.criterionTrackConfig.deleteMany();

        return { message: 'Ciclo iniciado e configs aplicadas', cycleId: cycle.id };
    }
}
