import { Body, Controller, Post, Get, Req, Query } from '@nestjs/common';
import { LeaderEvaluationDto } from '../dto/leader-evaluation.dto';
import { LeaderService } from '../services/leader.service';
import { OnlyLeader } from 'src/auth/decorators/roles.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { ApiBody } from '@nestjs/swagger';
import { exampleLeaderEvaluation } from 'src/common/decorators/post-bodies.examples';
import { Request } from 'express';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiAuth()
@OnlyLeader()
@Controller('leader')
export class LeaderController {
    constructor(private readonly leaderService: LeaderService) {}

    @Post('evaluate')
    @ApiBody({ schema: { example: exampleLeaderEvaluation } })
    async evaluate(@Body() dto: LeaderEvaluationDto) {
        return this.leaderService.evaluate(dto);
    }

    @Get('dashboard/summary')
    async getDashboardSummary(@Req() req: Request) {
        const leaderId = (req.user as any)?.id;
        return await this.leaderService.getDashboardSummary(leaderId);
    }

    @Get('collaborators/evaluations-summary')
    async getCollaboratorsEvaluationsSummary(@CurrentUser('id') leaderId: number) {
        return await this.leaderService.getCollaboratorsEvaluationsSummary(leaderId);
    }

    @Get('brutalfacts')
    async getBrutalfacts(@CurrentUser('id') leaderId: number) {
        return await this.leaderService.getBrutalfacts(leaderId);
    }

    @Get('evaluation')
    async getEvaluation(
        @CurrentUser('id') leaderId: number,
        @Query('cycleId') cycleId: number,
        @Query('collaboratorId') collaboratorId: number,
    ) {
        const evaluation = await this.leaderService.getEvaluation(
            Number(cycleId),
            Number(collaboratorId),
            leaderId,
        );
        return evaluation || {};
    }

    @Get('average-equalization-by-cycle')
    async getAverageEqualizationByCycle(@CurrentUser('id') leaderId: number) {
        return await this.leaderService.getAverageEqualizationByCycle(leaderId);
    }
}
