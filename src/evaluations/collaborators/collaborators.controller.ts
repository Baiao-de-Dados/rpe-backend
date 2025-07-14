import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CollaboratorsService } from './collaborators.service';
import {
    ApiGetCollaboratorsScores,
    ApiGetCollaboratorEvaluation,
    ApiGetCollaboratorEvaluationHistory,
} from './swagger/collaborators.swagger';
import { RequireCommittee, RequireManager, RequireRH } from 'src/auth/decorators/roles.decorator';

@ApiTags('Colaboradores')
@Controller('collaborators')
export class CollaboratorsController {
    constructor(private readonly collaboratorsService: CollaboratorsService) {}

    @Get()
    @RequireRH()
    @ApiGetCollaboratorsScores()
    @ApiQuery({ name: 'cycleId', required: false, type: Number })
    async getCollaboratorsScores() {
        return this.collaboratorsService.getCollaborators();
    }

    @Get(':collaboratorId')
    @RequireCommittee()
    @ApiGetCollaboratorEvaluation()
    @ApiParam({ name: 'collaboratorId', type: Number })
    async getCollaboratorEvaluation(@Param('collaboratorId', ParseIntPipe) collaboratorId: number) {
        return this.collaboratorsService.getCollaboratorEvaluations(collaboratorId);
    }

    @RequireCommittee()
    @RequireManager()
    @Get(':collaboratorId/history')
    @ApiGetCollaboratorEvaluationHistory()
    @ApiParam({ name: 'collaboratorId', type: Number })
    async getCollaboratorEvaluationHistory(
        @Param('collaboratorId', ParseIntPipe) collaboratorId: number,
    ) {
        return this.collaboratorsService.getCollaboratorEvaluationHistory(collaboratorId);
    }
}
