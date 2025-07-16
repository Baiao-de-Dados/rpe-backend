import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CollaboratorsService } from './collaborators.service';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
//import { OnlyCommittee } from 'src/auth/decorators/roles.decorator';

@ApiAuth()
@ApiTags('Colaboradores')
@Controller('collaborators')
//@OnlyCommittee()
export class CollaboratorsController {
    constructor(private readonly collaboratorsService: CollaboratorsService) {}

    @Get()
    @ApiQuery({ name: 'cycleId', required: false, type: Number })
    async getCollaboratorsScores() {
        return this.collaboratorsService.getCollaborators();
    }

    @Get(':collaboratorId')
    @ApiParam({ name: 'collaboratorId', type: Number })
    async getCollaboratorEvaluation(@Param('collaboratorId', ParseIntPipe) collaboratorId: number) {
        return this.collaboratorsService.getCollaboratorEvaluations(collaboratorId);
    }

    /*
    @Get(':collaboratorId/history')
    @ApiParam({ name: 'collaboratorId', type: Number })
    async getCollaboratorEvaluationHistory(
        @Param('collaboratorId', ParseIntPipe) collaboratorId: number,
    ) {
        return await this.collaboratorsService.getCollaboratorEvaluationHistory(collaboratorId);
    }
        */
}
