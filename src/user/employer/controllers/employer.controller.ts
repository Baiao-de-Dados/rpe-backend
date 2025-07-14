import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequireEmployer } from 'src/auth/decorators/roles.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { EmployerService } from '../services/employer.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { FiltersDto } from '../dto/filters.dto';
import { AutoEvaluationDto } from '../dto/auto-evaluation.dto';
import { Evaluation360Dto } from '../dto/evaluation-360.dto';
import { MentoringDto } from '../dto/mentoring.dto';
import { ApiBody } from '@nestjs/swagger';
import { exampleAutoEvaluation } from 'src/common/decorators/post-bodies.examples';
import { ReferenceDto } from '../dto/references.dto';

@ApiTags('Colaborador')
@ApiAuth()
@RequireEmployer()
@Controller('employer')
export class EmployerController {
    constructor(private readonly service: EmployerService) {}

    @Get('dashboard')
    getDashboard(@CurrentUser('id') userId: number) {
        return this.service.getDashboard(userId);
    }

    @Get('evolution')
    getEvolution(@Query() { CycleConfigId }: FiltersDto, @CurrentUser('id') userId: number) {
        return this.service.getEvolution(userId, CycleConfigId);
    }

    @Get('evaluations')
    findPendingEvaluations(
        @Query() { CycleConfigId }: FiltersDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.service.findPendingEvaluations(userId, CycleConfigId);
    }

    @Get('evaluations/:cycleId')
    getEvaluationData(
        @Param('cycleId', ParseIntPipe) cycleId: number,
        @CurrentUser('id') userId: number,
    ) {
        return this.service.getEvaluationData(userId, cycleId);
    }

    @Post('evaluations/:cycleId/auto')
    @ApiBody({ schema: { example: exampleAutoEvaluation } })
    submitAutoEvaluation(
        @Param('cycleId', ParseIntPipe) cycleId: number,
        @Body() dto: AutoEvaluationDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.service.submitAutoEvaluation(userId, cycleId, dto);
    }

    @Post('evaluations/:cycleId/360')
    submit360Evaluation(
        @Param('cycleId', ParseIntPipe) cycleId: number,
        @Body() dto: Evaluation360Dto,
        @CurrentUser('id') userId: number,
    ) {
        return this.service.submit360Evaluation(userId, cycleId, dto);
    }

    @Post('evaluations/:cycleId/mentoring')
    submitMentoring(
        @Param('cycleId', ParseIntPipe) cycleId: number,
        @Body() dto: MentoringDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.service.submitMentoring(userId, cycleId, dto);
    }

    @Post('evaluations/:cycleId/references')
    submitReferences(
        @Param('cycleId', ParseIntPipe) cycleId: number,
        @Body() dto: ReferenceDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.service.submitReferences(userId, cycleId, dto);
    }

    @Post('evaluations/:cycleId/complete')
    completeEvaluation(
        @Param('cycleId', ParseIntPipe) cycleId: number,
        @CurrentUser('id') userId: number,
    ) {
        return this.service.completeEvaluation(userId, cycleId);
    }
}
