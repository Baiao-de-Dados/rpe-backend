import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCycleConfigDto } from './dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from './dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from './dto/cycle-config-response.dto';
import { ExtendCycleDto } from './dto/extend-cycle.dto';

function isCycleActiveUtil(cycle: { done: boolean; startDate: Date; endDate: Date }): boolean {
    const now = new Date();
    return !cycle.done && now >= cycle.startDate && now <= cycle.endDate;
}

@Injectable()
export class CycleConfigService {
    constructor(private prisma: PrismaService) {}

    async create(createCycleConfigDto: CreateCycleConfigDto): Promise<CycleConfigResponseDto> {
        // Cria o ciclo e suas configurações em uma transação
        return await this.prisma.$transaction(async (prisma) => {
            const cycle = await prisma.cycleConfig.create({
                data: {
                    name: createCycleConfigDto.name,
                    description: createCycleConfigDto.description,
                    startDate: new Date(createCycleConfigDto.startDate),
                    endDate: new Date(createCycleConfigDto.endDate),
                    done: false,
                },
            });

            // Copiar configs de CriterionTrackConfig para CriterionTrackCycleConfig
            const draftConfigs = await prisma.criterionTrackConfig.findMany();
            if (draftConfigs.length > 0) {
                await prisma.criterionTrackCycleConfig.createMany({
                    data: draftConfigs.map((config) => ({
                        cycleId: cycle.id,
                        trackId: config.trackId,
                        criterionId: config.criterionId,
                        weight: config.weight,
                    })),
                });
            }

            return this.mapToResponseDto(cycle);
        });
    }

    async findAll(): Promise<CycleConfigResponseDto[]> {
        const cycles = await this.prisma.cycleConfig.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        return Promise.all(cycles.map((cycle) => this.mapToResponseDto(cycle)));
    }

    async findOne(id: number): Promise<CycleConfigResponseDto> {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id },
        });
        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }
        return await this.mapToResponseDto(cycle);
    }

    async findActive(): Promise<CycleConfigResponseDto | null> {
        const cycles = await this.prisma.cycleConfig.findMany();
        const active = cycles.find((cycle) => isCycleActiveUtil(cycle));
        return active ? this.mapToResponseDto(active) : null;
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
        // Atualizar dados básicos do ciclo
        const cycleData: any = {};
        if (updateCycleConfigDto.name) cycleData.name = updateCycleConfigDto.name;
        if (updateCycleConfigDto.description !== undefined)
            cycleData.description = updateCycleConfigDto.description;
        if (updateCycleConfigDto.startDate)
            cycleData.startDate = new Date(updateCycleConfigDto.startDate);
        if (updateCycleConfigDto.endDate)
            cycleData.endDate = new Date(updateCycleConfigDto.endDate);
        if (updateCycleConfigDto.done !== undefined) cycleData.done = updateCycleConfigDto.done;
        await this.prisma.cycleConfig.update({
            where: { id },
            data: cycleData,
        });
        return this.findOne(id);
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

    async cancelCycle(id: number): Promise<void> {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id },
        });
        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }
        // Cancelar todas as avaliações do ciclo
        await this.prisma.evaluation.deleteMany({
            where: { cycleConfigId: id },
        });
        // Apagar o ciclo do banco de dados
        await this.prisma.cycleConfig.delete({
            where: { id },
        });
    }

    async extendCycle(id: number, extendCycleDto: ExtendCycleDto): Promise<CycleConfigResponseDto> {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id },
        });
        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }
        // Verificar se a nova data de fim é posterior à data atual
        const newEndDate = new Date(extendCycleDto.endDate);
        const now = new Date();
        if (newEndDate <= now) {
            throw new BadRequestException('A nova data de fim deve ser posterior à data atual.');
        }
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

    async finalizeCycle(id: number): Promise<CycleConfigResponseDto> {
        const cycle = await this.prisma.cycleConfig.findUnique({ where: { id } });
        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }
        const updated = await this.prisma.cycleConfig.update({
            where: { id },
            data: { done: true },
        });
        return this.mapToResponseDto(updated);
    }

    private async mapToResponseDto(cycle: any): Promise<CycleConfigResponseDto> {
        const criterionConfigs = await this.prisma.criterionTrackCycleConfig.findMany({
            where: { cycleId: cycle.id },
            include: {
                criterion: {
                    include: {
                        pillar: true,
                    },
                },
                track: true,
            },
        });

        // Agrupar critérios por trilha e depois por pilar
        type CriteriaByTrackAndPillar = Record<
            number,
            {
                trackId: number;
                pillars: Record<
                    number,
                    {
                        pillarId: number;
                        criteria: Array<{
                            id: number;
                            criterionId: number;
                            weight: number;
                        }>;
                    }
                >;
            }
        >;

        const criteriaByTrackAndPillar = criterionConfigs.reduce(
            (acc: CriteriaByTrackAndPillar, cfg) => {
                const trackId = cfg.trackId;
                const pillarId = cfg.criterion.pillar.id;

                if (!acc[trackId]) {
                    acc[trackId] = {
                        trackId: trackId,
                        pillars: {},
                    };
                }

                if (!acc[trackId].pillars[pillarId]) {
                    acc[trackId].pillars[pillarId] = {
                        pillarId: pillarId,
                        criteria: [],
                    };
                }

                acc[trackId].pillars[pillarId].criteria.push({
                    id: cfg.id,
                    criterionId: cfg.criterionId,
                    weight: cfg.weight,
                });

                return acc;
            },
            {} as CriteriaByTrackAndPillar,
        );

        // Converter para o formato final
        const tracksWithPillars = Object.values(criteriaByTrackAndPillar).map((track) => ({
            trackId: track.trackId,
            pillars: Object.values(track.pillars),
        }));

        return {
            id: cycle.id,
            name: cycle.name,
            description: cycle.description,
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            done: cycle.done,
            isActive: isCycleActiveUtil(cycle),
            createdAt: cycle.createdAt,
            updatedAt: cycle.updatedAt,
            criteriaPillars: tracksWithPillars,
        };
    }
}
