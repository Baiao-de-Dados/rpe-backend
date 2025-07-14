import { Controller, Post, Body, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ActiveCriteriaUserResponseDto } from './dto/active-criteria-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { ApiCreate, ApiGet } from '../common/decorators/api-crud.decorator';
import { ApiAuth } from '../common/decorators/api-auth.decorator';
import { RequireEmployer, RequireRH, RequireLeader } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CycleConfigService } from '../cycles/cycle-config.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EvaluationDraftService } from './services/evaluation-draft.service';
import {
    EvaluationDraftRequestDto,
    EvaluationDraftResponseDto,
    evaluationDraftRequestExample,
    evaluationDraftResponseExample,
    EvaluationRequestDto,
    evaluationRequestExample,
    evaluationResponseExample,
} from './swagger/evaluation-draft.swagger';
import { EvaluationDraftDto } from './dto/evaluation-draft.dto';

@ApiTags('Avaliações')
@ApiAuth()
@Controller('evaluations')
export class EvaluationsController {
    constructor(
        private readonly evaluationsService: EvaluationsService,
        private readonly prisma: PrismaService,
        private readonly cycleConfigService: CycleConfigService,
        private readonly draftService: EvaluationDraftService,
    ) {}

    @RequireEmployer()
    @Post()
    @ApiCreate('avaliação')
    @ApiBody({
        type: EvaluationRequestDto,
        examples: { exemplo: evaluationRequestExample },
    })
    @ApiOkResponse({
        description: 'Avaliação criada com sucesso.',
        examples: { exemplo: evaluationResponseExample },
    })
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

    // --- Draft endpoints ---
    @RequireEmployer()
    @Post('draft')
    @ApiBody({
        type: EvaluationDraftRequestDto,
        examples: { exemplo: evaluationDraftRequestExample },
    })
    @ApiOkResponse({
        description: 'Draft salvo ou atualizado com sucesso.',
        type: EvaluationDraftResponseDto,
        examples: { exemplo: evaluationDraftResponseExample },
    })
    async upsertDraft(@CurrentUser('id') userId: number, @Body() body: EvaluationDraftDto) {
        return this.draftService.saveDraft(userId, body.cycleId, body.draft);
    }

    @RequireEmployer()
    @Get('draft')
    @ApiOkResponse({
        description: 'Draft do usuário para o ciclo informado.',
        type: EvaluationDraftResponseDto,
        isArray: false,
        examples: { exemplo: evaluationDraftResponseExample },
    })
    async getDraft(
        @CurrentUser('id') userId: number,
        @Query('cycleId', ParseIntPipe) cycleId: number,
    ) {
        return this.draftService.getDraft(userId, cycleId);
    }

    @RequireRH()
    @Get(':id')
    @ApiGet('avaliação')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.evaluationsService.findOne(id);
    }
}
