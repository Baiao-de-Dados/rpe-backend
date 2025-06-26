import { Controller, Post, Body, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto, SimpleCreateEvaluationDto } from './dto/create-evaluation.dto';
import { ActiveCriteriaResponseDto } from './dto/active-criteria-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiCreate, ApiGet } from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { RequireEmployer, RequireRH, RequireLeader } from 'src/auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CycleConfigService } from '../cycle-config/cycle-config.service';

@ApiTags('Avaliações')
@ApiAuth()
@Controller('evaluations')
export class EvaluationsController {
    constructor(
        private readonly evaluationsService: EvaluationsService,
        private readonly prisma: PrismaService,
        private readonly cycleConfigService: CycleConfigService,
    ) {}

    @RequireEmployer()
    @RequireLeader()
    @Post()
    @ApiCreate('avaliação')
    create(@Body() createEvaluationDto: CreateEvaluationDto) {
        return this.evaluationsService.createEvaluation(createEvaluationDto);
    }

    @RequireEmployer()
    @Post('simple')
    @ApiOperation({ summary: 'Criar autoavaliação simples' })
    @ApiResponse({ status: 201, description: 'Autoavaliação criada com sucesso' })
    async createSimple(@Body() createEvaluationDto: SimpleCreateEvaluationDto) {
        // Verificar se já existe uma autoavaliação para este usuário no ciclo
        const existingEvaluation = await this.prisma.evaluation.findFirst({
            where: {
                type: 'AUTOEVALUATION',
                evaluateeId: createEvaluationDto.evaluateeId,
                cycle: createEvaluationDto.cycle,
            },
        });

        if (existingEvaluation) {
            throw new Error(
                `Já existe uma autoavaliação para o usuário ${createEvaluationDto.evaluateeId} no ciclo ${createEvaluationDto.cycle}`,
            );
        }

        // Buscar ciclo ativo para validar data de expiração
        const activeCycle = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
        });

        if (!activeCycle) {
            throw new Error('Não há ciclo ativo configurado');
        }

        // Verificar se o ciclo não expirou
        const now = new Date();
        if (now > activeCycle.endDate) {
            throw new Error(
                `O ciclo ${activeCycle.name} expirou em ${activeCycle.endDate.toLocaleDateString()}. Não é possível criar autoavaliações.`,
            );
        }

        // Verificar se o ciclo já começou
        if (now < activeCycle.startDate) {
            throw new Error(
                `O ciclo ${activeCycle.name} ainda não começou. Início previsto para ${activeCycle.startDate.toLocaleDateString()}.`,
            );
        }

        // Validar se os critérios estão ativos no ciclo
        if (
            createEvaluationDto.criteriaAssignments &&
            createEvaluationDto.criteriaAssignments.length > 0
        ) {
            const criterionIds = createEvaluationDto.criteriaAssignments.map(
                (ca) => ca.criterionId,
            );

            // Buscar configurações dos critérios no ciclo atual
            const criterionConfigs = await this.prisma.criterionCycleConfig.findMany({
                where: {
                    criterionId: { in: criterionIds },
                    cycle: { isActive: true },
                },
                include: {
                    criterion: true,
                },
            });

            // Verificar se todos os critérios estão ativos
            const inactiveCriteria = createEvaluationDto.criteriaAssignments.filter((ca) => {
                const config = criterionConfigs.find((cc) => cc.criterionId === ca.criterionId);
                return !config || !config.isActive;
            });

            if (inactiveCriteria.length > 0) {
                const inactiveIds = inactiveCriteria.map((ca) => ca.criterionId);
                throw new Error(`Critérios inativos no ciclo atual: ${inactiveIds.join(', ')}`);
            }
        }

        // Criar a avaliação
        const evaluation = await this.prisma.evaluation.create({
            data: {
                type: createEvaluationDto.type,
                evaluatorId: createEvaluationDto.evaluateeId, // Autoavaliação
                evaluateeId: createEvaluationDto.evaluateeId,
                cycle: createEvaluationDto.cycle,
                justification: createEvaluationDto.justification,
                score: createEvaluationDto.score,
            },
        });

        // Criar as atribuições de critérios
        if (
            createEvaluationDto.criteriaAssignments &&
            createEvaluationDto.criteriaAssignments.length > 0
        ) {
            await this.prisma.criteriaAssignment.createMany({
                data: createEvaluationDto.criteriaAssignments.map((ca) => ({
                    autoEvaluationID: evaluation.id,
                    criterionId: ca.criterionId,
                    note: ca.note,
                    justification: ca.justification,
                })),
            });
        }

        return evaluation;
    }

    @RequireRH()
    @Get()
    @ApiGet('avaliações')
    findAll(@Query('type') type?: string) {
        if (type) {
            return this.evaluationsService.findByType(type);
        }
        return this.evaluationsService.findAll();
    }

    @RequireRH()
    @Get('type/:type')
    @ApiGet('avaliações por tipo')
    findByType(@Param('type') type: string) {
        return this.evaluationsService.findByType(type);
    }

    @RequireRH()
    @Get('peer360')
    @ApiGet('avaliações peer 360')
    findAllPeer360() {
        return this.evaluationsService.findByType('PEER_360');
    }

    @RequireRH()
    @Get('leader')
    @ApiGet('avaliações de líder')
    findAllLeader() {
        return this.evaluationsService.findByType('LEADER');
    }

    @RequireRH()
    @Get('mentor')
    @ApiGet('avaliações de mentor')
    findAllMentor() {
        return this.evaluationsService.findByType('MENTOR');
    }

    @RequireRH()
    @Get('auto')
    @ApiGet('autoavaliações')
    findAllAuto() {
        return this.evaluationsService.findByType('AUTOEVALUATION');
    }

    @RequireRH()
    @Get('peer360/:evaluateeId')
    @ApiGet('avaliações peer 360 por avaliado')
    findPeer360ByEvaluatee(@Param('evaluateeId', ParseIntPipe) evaluateeId: number) {
        return this.evaluationsService.findByTypeAndEvaluatee('PEER_360', evaluateeId);
    }

    @RequireRH()
    @Get('leader/:evaluateeId')
    @ApiGet('avaliações de líder por avaliado')
    findLeaderByEvaluatee(@Param('evaluateeId', ParseIntPipe) evaluateeId: number) {
        return this.evaluationsService.findByTypeAndEvaluatee('LEADER', evaluateeId);
    }

    @RequireRH()
    @Get('mentor/:evaluateeId')
    @ApiGet('avaliações de mentor por avaliado')
    findMentorByEvaluatee(@Param('evaluateeId', ParseIntPipe) evaluateeId: number) {
        return this.evaluationsService.findByTypeAndEvaluatee('MENTOR', evaluateeId);
    }

    @RequireRH()
    @Get('auto/:evaluateeId')
    @ApiGet('autoavaliações por usuário')
    findAutoByEvaluatee(@Param('evaluateeId', ParseIntPipe) evaluateeId: number) {
        return this.evaluationsService.findByTypeAndEvaluatee('AUTOEVALUATION', evaluateeId);
    }

    @RequireLeader()
    @Get('by-evaluator/:evaluatorId')
    @ApiGet('avaliações por avaliador')
    findByEvaluator(
        @Param('evaluatorId', ParseIntPipe) evaluatorId: number,
        @Query('type') type?: string,
    ) {
        if (type) {
            return this.evaluationsService.findByTypeAndEvaluator(type, evaluatorId);
        }
        // Se não especificar tipo, retorna todas as avaliações do avaliador
        return this.evaluationsService.findByTypeAndEvaluator('LEADER', evaluatorId);
    }

    @RequireEmployer()
    @Get('active-criteria')
    @ApiOperation({
        summary: 'Buscar critérios ativos do ciclo atual',
        description:
            'Retorna todos os critérios que estão ativos no ciclo de avaliação atual para uso em autoavaliações',
    })
    @ApiResponse({
        status: 200,
        description: 'Critérios ativos encontrados',
        type: ActiveCriteriaResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Nenhum ciclo ativo encontrado' })
    async getActiveCriteria(): Promise<ActiveCriteriaResponseDto> {
        const activeCriteria = await this.cycleConfigService.getActiveCriteria();
        return { criteria: activeCriteria };
    }

    @RequireEmployer()
    @Get('active-criteria/grouped')
    @ApiOperation({
        summary: 'Buscar critérios ativos agrupados por pilar',
        description:
            'Retorna os critérios ativos organizados por pilar para facilitar o uso em formulários de autoavaliação',
    })
    @ApiResponse({
        status: 200,
        description: 'Critérios ativos agrupados por pilar',
    })
    @ApiResponse({ status: 404, description: 'Nenhum ciclo ativo encontrado' })
    async getActiveCriteriaGrouped() {
        const activeCriteria = await this.cycleConfigService.getActiveCriteria();

        // Agrupar critérios por pilar
        const groupedByPillar = activeCriteria.reduce((acc, criterion) => {
            const pillarId = criterion.pillar.id;
            if (!acc[pillarId]) {
                acc[pillarId] = {
                    id: criterion.pillar.id,
                    name: criterion.pillar.name,
                    description: criterion.pillar.description,
                    criterios: [],
                };
            }

            acc[pillarId].criterios.push({
                id: criterion.id,
                name: criterion.name,
                description: criterion.description,
                weight: criterion.weight,
            });

            return acc;
        }, {});

        return Object.values(groupedByPillar);
    }

    @RequireRH()
    @Get(':id')
    @ApiGet('avaliação')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.evaluationsService.findOne(id);
    }
}
