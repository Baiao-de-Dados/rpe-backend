import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RequireRH } from '../../auth/decorators/roles.decorator';
import { CollaboratorsService } from './collaborators.service';
import { ApiGetCollaboratorsScores } from './swagger/collaborators.swagger';
import { GetCollaboratorsScoresDto } from './dto/get-collaborators-scores.dto';
import { QueryValidationPipe } from '../../common/pipes/query-validation.pipe';

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
}
