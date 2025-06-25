import { CollaboratorsStatusDto, CollaboratorStatusDto } from '../dto/collaborator.dashboard.dto';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiAuth } from '../../../common/decorators/api-auth.decorator';
import { RequireRH } from '../../../auth/decorators/roles.decorator';
import { RoleCompletionStatsDto } from '../dto/roles.dashboard.dto';
import { ApiTags } from '@nestjs/swagger';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';
import { RhPanelService } from '../services/rh-panel.service';
import { ApiGet } from 'src/common/decorators/api-crud.decorator';
import { ApiQueryCycle } from 'src/common/decorators/api-query-cycle.decorator';

@ApiTags('Painel RH')
@ApiAuth()
@Controller('rh/panel')
export class RhPanelController {
    constructor(private readonly rhPanelService: RhPanelService) {}

    @RequireRH()
    @Get('dashboard')
    @ApiQueryCycle()
    @ApiGet('dashboard')
    getDashboardStats(@Query('cycle') cycle?: string): Promise<DashboardStatsDto> {
        return this.rhPanelService.getDashboardStats(cycle);
    }

    @RequireRH()
    @Get('collaborators/status')
    @ApiGet('status')
    getCollaboratorsStatus(): Promise<CollaboratorsStatusDto> {
        return this.rhPanelService.getCollaboratorsStatus();
    }

    @RequireRH()
    @Get('collaborators/:id/status')
    @ApiGet('statusById')
    getCollaboratorStatusById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CollaboratorStatusDto> {
        return this.rhPanelService.getCollaboratorStatusById(id);
    }

    @RequireRH()
    @Get('roles/completion')
    @ApiGet('roleCompletionStats')
    getRoleCompletionStats(): Promise<RoleCompletionStatsDto> {
        return this.rhPanelService.getRoleCompletionStats();
    }
}
