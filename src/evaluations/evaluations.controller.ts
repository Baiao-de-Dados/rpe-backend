import { Controller, Post, Body, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ActiveCriteriaUserResponseDto } from './dto/active-criteria-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiCreate, ApiGet } from '../common/decorators/api-crud.decorator';
import { ApiAuth } from '../common/decorators/api-auth.decorator';
import { RequireEmployer, RequireRH, RequireLeader } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CycleConfigService } from '../cycles/cycle-config.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
    create(@Body() createEvaluationDto: CreateEvaluationDto, @CurrentUser() user: any) {
        return this.evaluationsService.createEvaluation(createEvaluationDto, user);
    }

    @RequireRH()
    @Get()
    @ApiGet('avaliações')
    findAll(@Query('evaluatorId') evaluatorId?: number) {
        // Lógica unificada para filtros
        return this.evaluationsService.findWithFilters(evaluatorId);
    }

    @RequireLeader()
    @Get('by-evaluator/:evaluatorId')
    @ApiGet('avaliações por avaliador')
    findByEvaluator(@Param('evaluatorId', ParseIntPipe) evaluatorId: number) {
        return this.evaluationsService.findWithFilters(evaluatorId);
    }

    @RequireEmployer()
    @Get('active-criteria/user')
    @ApiOperation({
        summary: 'Buscar critérios ativos para o usuário logado baseado em sua trilha/cargo',
        description:
            'Retorna apenas os critérios que estão ativos no ciclo atual E configurados para a trilha e cargo específicos do usuário logado',
    })
    @ApiResponse({
        status: 200,
        description: 'Critérios ativos para o usuário logado',
        type: ActiveCriteriaUserResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Usuário não encontrado ou sem critérios configurados',
    })
    async getActiveCriteriaForUser(
        @CurrentUser() user: any,
    ): Promise<ActiveCriteriaUserResponseDto> {
        return this.evaluationsService.getActiveCriteriaForUser(user);
    }

    @RequireRH()
    @Get(':id')
    @ApiGet('avaliação')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.evaluationsService.findOne(id);
    }
}
