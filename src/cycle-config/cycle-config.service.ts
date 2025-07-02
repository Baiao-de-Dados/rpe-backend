import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCycleConfigDto } from './dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from './dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from './dto/cycle-config-response.dto';

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

        // Buscar todos os CriterionTrackConfig ativos para preencher o ciclo
        const activeTrackConfigs = await this.prisma.criterionTrackConfig.findMany({
            where: { isActive: true },
        });

        // Montar configs de critério para o ciclo, sem duplicar os já enviados no payload
        const existingCriterionIds = new Set(
            (createCycleConfigDto.criterionConfigs || []).map((c) => c.criterionId),
        );
        const autoCriterionConfigs = activeTrackConfigs
            .filter((config) => !existingCriterionIds.has(config.criterionId))
            .map((config) => ({
                criterionId: config.criterionId,
                isActive: false,
                weight: config.weight,
            }));

        // Unir os configs do payload com os auto-gerados
        const allCriterionConfigs = [
            ...(createCycleConfigDto.criterionConfigs || []),
            ...autoCriterionConfigs,
        ];
        createCycleConfigDto.criterionConfigs = allCriterionConfigs;

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

            // Criar configurações dos critérios
            if (createCycleConfigDto.criterionConfigs.length > 0) {
                await prisma.criterionCycleConfig.createMany({
                    data: createCycleConfigDto.criterionConfigs.map((config) => ({
                        cycleId: cycle.id,
                        criterionId: config.criterionId,
                        isActive: config.isActive,
                        weight: config.weight,
                    })),
                });
            }

            // Retornar o ciclo diretamente sem chamar findOne
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
                criterionConfigs: {
                    include: {
                        criterion: {
                            include: {
                                pillar: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return cycles.map((cycle) => this.mapToResponseDto(cycle));
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
                criterionConfigs: {
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

        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${id} não encontrado`);
        }

        return this.mapToResponseDto(cycle);
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
                criterionConfigs: {
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

            // Atualizar configurações dos critérios se fornecidas
            if (updateCycleConfigDto.criterionConfigs) {
                // Remover configurações existentes
                await prisma.criterionCycleConfig.deleteMany({
                    where: { cycleId: id },
                });

                // Criar novas configurações
                if (updateCycleConfigDto.criterionConfigs.length > 0) {
                    await prisma.criterionCycleConfig.createMany({
                        data: updateCycleConfigDto.criterionConfigs.map((config) => ({
                            cycleId: id,
                            criterionId: config.criterionId,
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
            include: {
                criterionConfigs: {
                    where: { isActive: true },
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

        if (!activeCycle) {
            return [];
        }

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

        return activeCycle.criterionConfigs.map((config) => ({
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

    private mapToResponseDto(cycle: any): CycleConfigResponseDto {
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
            criterionConfigs: (cycle.criterionConfigs || []).map((config: any) => ({
                id: config.id,
                criterionId: config.criterionId,
                criterionName: config.criterion?.name || 'N/A',
                pillarId: config.criterion?.pillar?.id || 0,
                pillarName: config.criterion?.pillar?.name || 'N/A',
                isActive: config.isActive,
                weight: config.weight,
            })),
        };
    }
}
