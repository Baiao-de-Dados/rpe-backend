import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OnlyManager } from 'src/auth/decorators/roles.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { AssignLeaderDto } from '../dto/assign-leader.dto';
import { AssignLeaderEvaluationDto } from '../dto/assign-leader-evaluation.dto';
import { ManagerEvaluationDto } from '../dto/manager-evaluation.dto';
import { ManagerService } from '../services/manager.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('Gestor')
@ApiAuth()
@OnlyManager()
@Controller('manager')
export class ManagerController {
    constructor(private readonly managerService: ManagerService) {}

    @Post('assign-leader')
    assignLeader(@Body() dto: AssignLeaderDto, @CurrentUser('id') userId: number) {
        return this.managerService.assignLeaderToProject(dto, userId);
    }

    @Delete('projects/:projectId/leaders/:leaderId')
    removeLeader(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Param('leaderId', ParseIntPipe) leaderId: number,
        @CurrentUser('id') userId: number,
    ) {
        return this.managerService.removeLeaderFromProject(projectId, leaderId, userId);
    }

    @Get('projects/:projectId/leaders')
    getProjectLeaders(
        @Param('projectId', ParseIntPipe) projectId: number,
        @CurrentUser('id') userId: number,
    ) {
        return this.managerService.getProjectLeaders(projectId, userId);
    }

    @Post('assign-leader-evaluation')
    assignLeaderToEvaluateCollaborator(
        @Body() dto: AssignLeaderEvaluationDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.managerService.assignLeaderToEvaluateCollaborator(dto, userId);
    }

    @Get('leaders-and-collaborators')
    getLeadersAndCollaborators(@CurrentUser('id') userId: number) {
        return this.managerService.getLeadersAndCollaborators(userId);
    }

    @Post('evaluate')
    evaluateCollaborator(@Body() dto: ManagerEvaluationDto, @CurrentUser('id') userId: number) {
        return this.managerService.evaluateCollaborator(dto, userId);
    }

    @Get('dashboard/total-leaders')
    getTotalLeaders(@CurrentUser('id') userId: number) {
        return this.managerService.getTotalLeaders(userId);
    }

    @Get('dashboard/evaluation-percentage')
    getEvaluationPercentage(@CurrentUser('id') userId: number) {
        return this.managerService.getEvaluationPercentage(userId);
    }

    @Get('dashboard/missing-evaluations')
    getMissingEvaluations(@CurrentUser('id') userId: number) {
        return this.managerService.getMissingEvaluations(userId);
    }
    @Get('dashboard/leaders/evaluation-percentage')
    getLeaderEvaluationPercentage(@CurrentUser('id') userId: number) {
        return this.managerService.getLeaderEvaluationPercentage(userId);
    }

    @Get('dashboard/collaborators/without-leader')
    getCollaboratorsWithoutLeader(@CurrentUser('id') userId: number) {
        return this.managerService.getCollaboratorsWithoutLeader(userId);
    }

    @Get('auto-evaluation/:userId')
    getUserAutoEvaluation(
        @Param('userId', ParseIntPipe) userId: number,
        @CurrentUser('id') managerId: number,
    ) {
        return this.managerService.getUserAutoEvaluation(userId, managerId);
    }
}
