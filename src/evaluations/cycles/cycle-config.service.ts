import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCycleConfigDto } from 'src/evaluations/cycles/dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from './dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from './dto/cycle-config-response.dto';
import { ExtendCycleDto } from './dto/extend-cycle.dto';

@Injectable()
export class CycleConfigService {
    constructor(private prisma: PrismaService) {}

    async create(createCycleConfigDto: CreateCycleConfigDto): Promise<CycleConfigResponseDto> {
        // Sempre desativa todos os ciclos antes de criar um novo
        await this.prisma.cycleConfig.updateMany({
            where: { isActive: true },
            data: { isActive: false },
        });

        // Cria o ciclo e suas configurações em uma transação
        return await this.prisma.$transaction(async (prisma) => {
            const cycle = await prisma.cycleConfig.create({
                data: {
                    name: createCycleConfigDto.name,
                    description: createCycleConfigDto.description,
                    startDate: new Date(createCycleConfigDto.startDate),
                    endDate: new Date(createCycleConfigDto.endDate),
                    isActive: true, // Sempre ativo
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

            // (Opcional) Limpar configs de rascunho após aplicar
            // await prisma.criterionTrackConfig.deleteMany();

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
        const cycle = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
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

    async cancelCycle(id: number): Promise<void> {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id },
        });

        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }

        if (!cycle.isActive) {
            throw new BadRequestException(
                `Ciclo ${cycle.name} não está ativo. Apenas ciclos ativos podem ser cancelados.`,
            );
        }

        // Cancelar todas as avaliações do ciclo
        await this.prisma.evaluation.updateMany({
            where: { cycleConfigId: id },
            data: { status: 'COMPLETED' },
        });

        // Desativar o ciclo
        // await this.prisma.cycleConfig.update({
        //     where: { id },
        //     data: { isActive: false },
        // });

        // Apagar o ciclo do banco de dados
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

        // Buscar critérios do ciclo através de CriterionTrackCycleConfig
        const activeCriteria = await this.prisma.criterionTrackCycleConfig.findMany({
            where: {
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
            isActive: cycle.isActive,
            createdAt: cycle.createdAt,
            updatedAt: cycle.updatedAt,
            criteriaPillars: tracksWithPillars,
        };
    }
}
