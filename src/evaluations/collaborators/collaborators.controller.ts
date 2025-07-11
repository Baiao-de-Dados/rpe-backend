import { Controller, Get, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RequireCommittee, RequireRH } from '../../auth/decorators/roles.decorator';
import { CollaboratorsService } from './collaborators.service';
import { ApiGetCollaboratorsScores } from './swagger/collaborators.swagger';
import { GetCollaboratorsScoresDto } from './dto/get-collaborators-scores.dto';
import { QueryValidationPipe } from '../../common/pipes/query-validation.pipe';
import { ApiGetCollaboratorEvaluationCommittee, ApiGetCollaboratorEvaluationManager } from './swagger/collaborators-evaluation.swagger';

@ApiTags('Colaboradores')
@Controller('collaborators')
export class CollaboratorsController {
    constructor(private readonly collaboratorsService: CollaboratorsService) {}

    @RequireRH()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('scores')
    @ApiGetCollaboratorsScores()
    async getCollaboratorsScores(
        @Query(new QueryValidationPipe()) query: GetCollaboratorsScoresDto,
    ) {
        return this.collaboratorsService.getCollaboratorsScores(query.cycleId);
    }

    @RequireCommittee()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('evaluation/committee')
    @ApiGetCollaboratorEvaluationCommittee()
    async getCollaboratorEvaluationForCommittee(
        @Query(new QueryValidationPipe()) query: GetCollaboratorsScoresDto,
    ) {
        if (!query.cycleId || !query.collaboratorId) {
            throw new BadRequestException('cycleId and collaboratorId are required.');
        }
        return this.collaboratorsService.getCollaboratorEvaluation(query.cycleId, query.collaboratorId, 'COMMITTEE');
    }

    @RequireManager()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('evaluation/manager')
    @ApiGetCollaboratorEvaluationManager()
    async getCollaboratorEvaluationForManager(
        @Query(new QueryValidationPipe()) query: GetCollaboratorsScoresDto,
    ) {
        if (!query.cycleId || !query.collaboratorId) {
            throw new BadRequestException('cycleId and collaboratorId are required.');
        }
        return this.collaboratorsService.getCollaboratorEvaluation(query.cycleId, query.collaboratorId, 'MANAGER');
    }
}

import { SetMetadata } from '@nestjs/common';

function RequireManager(): MethodDecorator {
    return (target, propertyKey, descriptor) => {
        SetMetadata('roles', ['MANAGER'])(target, propertyKey, descriptor);
    };
}

