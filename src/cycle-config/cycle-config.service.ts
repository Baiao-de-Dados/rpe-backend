import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCycleConfigDto } from './dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from './dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from './dto/cycle-config-response.dto';
import { ExtendCycleDto } from './dto/extend-cycle.dto';

@Injectable()
export class CycleConfigService {
    constructor(private prisma: PrismaService) {}

    async create(createCycleConfigDto: CreateCycleConfigDto): Promise<CycleConfigResponseDto> {
        // Verificar se já existe um ciclo com o mesmo nome
        const existingCycle = await this.prisma.cycleConfig.findUnique({
            where: { name: createCycleConfigDto.name },
        });

        if (existingCycle) {
            throw new BadRequestException(
                `Já existe um ciclo com o nome: ${createCycleConfigDto.name}`,
            );
        }

        // Se este ciclo será ativo, desativar outros ciclos
        if (createCycleConfigDto.isActive) {
            await this.prisma.cycleConfig.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });
        }

        // Criar o ciclo e suas configurações em uma transação
        return await this.prisma.$transaction(async (prisma) => {
            const cycle = await prisma.cycleConfig.create({
                data: {
                    name: createCycleConfigDto.name,
                    description: createCycleConfigDto.description,
                    startDate: new Date(createCycleConfigDto.startDate),
                    endDate: new Date(createCycleConfigDto.endDate),
                    isActive: createCycleConfigDto.isActive,
                },
            });

            // Criar configurações dos pilares
            if (createCycleConfigDto.pillarConfigs.length > 0) {
                await prisma.pillarCycleConfig.createMany({
                    data: createCycleConfigDto.pillarConfigs.map((config) => ({
                        cycleId: cycle.id,
                        pillarId: config.pillarId,
                        isActive: config.isActive,
                        weight: config.weight,
                    })),
                });
            }

            // Copiar configs de CriterionTrackConfig para CriterionTrackCycleConfig
            const draftConfigs = await prisma.criterionTrackConfig.findMany();
            if (draftConfigs.length > 0) {
                await prisma.criterionTrackCycleConfig.createMany({
                    data: draftConfigs.map((config) => ({
                        cycleId: cycle.id,
                        trackId: config.trackId,
                        criterionId: config.criterionId,
                        weight: config.weight,
                        isActive: config.isActive,
                    })),
                });
            }

            // (Opcional) Limpar configs de rascunho após aplicar
            // await prisma.criterionTrackConfig.deleteMany();

            return this.mapToResponseDto(cycle);
        });
    }

    async findAll(): Promise<CycleConfigResponseDto[]> {
        const cycles = await this.prisma.cycleConfig.findMany({
            include: {
                pillarConfigs: {
                    include: {
                        pillar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return Promise.all(cycles.map((cycle) => this.mapToResponseDto(cycle)));
    }

    async findOne(id: number): Promise<CycleConfigResponseDto> {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id },
            include: {
                pillarConfigs: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });

        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }

        return await this.mapToResponseDto(cycle);
    }

    async findActive(): Promise<CycleConfigResponseDto | null> {
        const cycle = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
            include: {
                pillarConfigs: {
                    include: {
                        pillar: true,
                    },
                },
            },
        });

        return cycle ? this.mapToResponseDto(cycle) : null;
    }

    async update(
        id: number,
        updateCycleConfigDto: UpdateCycleConfigDto,
    ): Promise<CycleConfigResponseDto> {
        const existingCycle = await this.prisma.cycleConfig.findUnique({
            where: { id },
        });

        if (!existingCycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }

        // Se o nome está sendo alterado, verificar se já existe outro ciclo com o mesmo nome
        if (updateCycleConfigDto.name && updateCycleConfigDto.name !== existingCycle.name) {
            const cycleWithSameName = await this.prisma.cycleConfig.findUnique({
                where: { name: updateCycleConfigDto.name },
            });

            if (cycleWithSameName) {
                throw new BadRequestException(
                    `Já existe um ciclo com o nome: ${updateCycleConfigDto.name}`,
                );
            }
        }

        // Se este ciclo será ativo, desativar outros ciclos
        if (updateCycleConfigDto.isActive) {
            await this.prisma.cycleConfig.updateMany({
                where: {
                    isActive: true,
                    id: { not: id },
                },
                data: { isActive: false },
            });
        }

        return await this.prisma.$transaction(async (prisma) => {
            // Atualizar dados básicos do ciclo
            const cycleData: any = {};
            if (updateCycleConfigDto.name) cycleData.name = updateCycleConfigDto.name;
            if (updateCycleConfigDto.description !== undefined)
                cycleData.description = updateCycleConfigDto.description;
            if (updateCycleConfigDto.startDate)
                cycleData.startDate = new Date(updateCycleConfigDto.startDate);
            if (updateCycleConfigDto.endDate)
                cycleData.endDate = new Date(updateCycleConfigDto.endDate);
            if (updateCycleConfigDto.isActive !== undefined)
                cycleData.isActive = updateCycleConfigDto.isActive;

            await prisma.cycleConfig.update({
                where: { id },
                data: cycleData,
            });

            // Atualizar configurações dos pilares se fornecidas
            if (updateCycleConfigDto.pillarConfigs) {
                // Remover configurações existentes
                await prisma.pillarCycleConfig.deleteMany({
                    where: { cycleId: id },
                });

                // Criar novas configurações
                if (updateCycleConfigDto.pillarConfigs.length > 0) {
                    await prisma.pillarCycleConfig.createMany({
                        data: updateCycleConfigDto.pillarConfigs.map((config) => ({
                            cycleId: id,
                            pillarId: config.pillarId,
                            isActive: config.isActive,
                            weight: config.weight,
                        })),
                    });
                }
            }

            return this.findOne(id);
        });
    }

    async remove(id: number): Promise<void> {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id },
        });

        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }

        await this.prisma.cycleConfig.delete({
            where: { id },
        });
    }

    async getActiveCriteria(): Promise<any[]> {
        const activeCycle = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
        });

        if (!activeCycle) {
            return [];
        }

        // Buscar critérios ativos do ciclo através de CriterionTrackCycleConfig
        const activeCriteria = await this.prisma.criterionTrackCycleConfig.findMany({
            where: {
                cycleId: activeCycle.id,
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

        // Verificar se o ciclo não expirou
        const now = new Date();
        if (now > activeCycle.endDate) {
            throw new BadRequestException(
                `O ciclo ${activeCycle.name} expirou em ${activeCycle.endDate.toLocaleDateString()}. Não é possível criar avaliações.`,
            );
        }

        // Verificar se o ciclo já começou
        if (now < activeCycle.startDate) {
            throw new BadRequestException(
                `O ciclo ${activeCycle.name} ainda não começou. Início previsto para ${activeCycle.startDate.toLocaleDateString()}.`,
            );
        }

        return activeCriteria.map((config) => ({
            id: config.criterion.id,
            name: config.criterion.name,
            description: config.criterion.description,
            weight: config.weight,
            pillar: {
                id: config.criterion.pillar.id,
                name: config.criterion.pillar.name,
            },
        }));
    }

    async getActiveCycle() {
        return await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
        });
    }

    async isCycleActive(): Promise<boolean> {
        const activeCycle = await this.getActiveCycle();
        if (!activeCycle) {
            return false;
        }

        const now = new Date();
        return now >= activeCycle.startDate && now <= activeCycle.endDate;
    }

    async validateCycleNotActive() {
        const isActive = await this.isCycleActive();
        if (isActive) {
            const activeCycle = await this.getActiveCycle();
            if (activeCycle) {
                throw new BadRequestException(
                    `Não é possível fazer alterações enquanto o ciclo ${activeCycle.name} estiver ativo. Desative o ciclo atual antes de fazer modificações.`,
                );
            }
        }
    }

    async extendCycle(id: number, extendCycleDto: ExtendCycleDto): Promise<CycleConfigResponseDto> {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id },
        });

        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }

        // Verificar se o ciclo está ativo
        if (!cycle.isActive) {
            throw new BadRequestException(
                `Não é possível prorrogar o ciclo ${cycle.name} pois ele não está ativo.`,
            );
        }

        // Verificar se a nova data de fim é posterior à data atual
        const newEndDate = new Date(extendCycleDto.endDate);
        const now = new Date();

        if (newEndDate <= now) {
            throw new BadRequestException('A nova data de fim deve ser posterior à data atual.');
        }

        // Verificar se a nova data de fim é posterior à data de fim atual
        if (newEndDate <= cycle.endDate) {
            throw new BadRequestException(
                'A nova data de fim deve ser posterior à data de fim atual.',
            );
        }

        // Atualizar apenas a data de fim
        const updatedCycle = await this.prisma.cycleConfig.update({
            where: { id },
            data: {
                endDate: newEndDate,
            },
        });

        return this.mapToResponseDto(updatedCycle);
    }

    async getCycleTracksWithPillarsAndCriteria(cycleId: number) {
        // Buscar todas as trilhas
        const tracks = await this.prisma.track.findMany();
        // Buscar todos os pilares
        const pillars = await this.prisma.pillar.findMany();
        // Buscar todas as configs de critério do ciclo
        const criterionConfigs = await this.prisma.criterionTrackCycleConfig.findMany({
            where: { cycleId },
            include: {
                criterion: true,
                track: true,
            },
        });

        // Montar estrutura agrupada
        const trackMap = new Map<number, any>();
        for (const track of tracks) {
            trackMap.set(track.id, {
                trackId: track.id,
                trackName: track.name,
                pillars: pillars.map((pillar) => ({
                    id: pillar.id,
                    name: pillar.name,
                    criteria: [],
                })),
            });
        }

        for (const cfg of criterionConfigs) {
            const trackObj = trackMap.get(cfg.trackId);
            if (!trackObj) continue;
            const pillarObj = trackObj.pillars.find((p: any) => p.id === cfg.criterion.pillarId);
            if (!pillarObj) continue;
            pillarObj.criteria.push({
                id: cfg.criterion.id,
                name: cfg.criterion.name,
                description: cfg.criterion.description,
                weight: cfg.weight,
                isActive: cfg.isActive,
            });
        }

        return Array.from(trackMap.values());
    }

    private async mapToResponseDto(cycle: any): Promise<CycleConfigResponseDto> {
        // Buscar configs de critério do ciclo
        const criterionConfigs = await this.prisma.criterionTrackCycleConfig.findMany({
            where: { cycleId: cycle.id },
            include: {
                criterion: true,
                track: true,
            },
        });

        return {
            id: cycle.id,
            name: cycle.name,
            description: cycle.description,
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            isActive: cycle.isActive,
            createdAt: cycle.createdAt,
            updatedAt: cycle.updatedAt,
            pillarConfigs: (cycle.pillarConfigs || []).map((config: any) => ({
                id: config.id,
                pillarId: config.pillarId,
                pillarName: config.pillar?.name || 'N/A',
                isActive: config.isActive,
                weight: config.weight,
            })),
            criterionConfigs: criterionConfigs.map((cfg) => ({
                id: cfg.id,
                criterionId: cfg.criterionId,
                criterionName: cfg.criterion.name,
                trackId: cfg.trackId,
                trackName: cfg.track.name,
                weight: cfg.weight,
                isActive: cfg.isActive,
            })),
        };
    }
}
