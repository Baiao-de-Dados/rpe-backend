import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RhPanelService } from '../services/rh-panel.service';
import {
    DashboardStatsDto,
    CollaboratorsStatusDto,
    CollaboratorStatusDto,
    RoleCompletionStatsDto,
} from '../dto/dashboard-stats.dto';
import { ApiAuth } from '../../../common/decorators/api-auth.decorator';
import { RequireRH } from '../../../auth/decorators/roles.decorator';

@ApiTags('Painel RH')
@ApiAuth()
@Controller('rh/panel')
export class RhPanelController {
    constructor(private readonly rhPanelService: RhPanelService) {}

    @RequireRH()
    @Get('dashboard')
    @ApiQuery({
        name: 'cycle',
        required: false,
        description:
            'Ciclo específico para análise (ex: 2024-01). Se não fornecido, usa o ciclo mais recente.',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Estatísticas do painel RH retornadas com sucesso',
        type: DashboardStatsDto,
    })
    getDashboardStats(@Query('cycle') cycle?: string): Promise<DashboardStatsDto> {
        return this.rhPanelService.getDashboardStats(cycle);
    }

    @RequireRH()
    @Get('collaborators/status')
    @ApiResponse({
        status: 200,
        description: 'Status de todos os colaboradores retornado com sucesso',
        type: CollaboratorsStatusDto,
    })
    getCollaboratorsStatus(): Promise<CollaboratorsStatusDto> {
        return this.rhPanelService.getCollaboratorsStatus();
    }

    @RequireRH()
    @Get('collaborators/:id/status')
    @ApiResponse({
        status: 200,
        description: 'Status do colaborador específico retornado com sucesso',
        type: CollaboratorStatusDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Colaborador não encontrado',
    })
    getCollaboratorStatusById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CollaboratorStatusDto> {
        return this.rhPanelService.getCollaboratorStatusById(id);
    }

    @RequireRH()
    @Get('roles/completion')
    @ApiResponse({
        status: 200,
        description: 'Estatísticas de preenchimento por role retornadas com sucesso',
        type: RoleCompletionStatsDto,
    })
    getRoleCompletionStats(): Promise<RoleCompletionStatsDto> {
        return this.rhPanelService.getRoleCompletionStats();
    }
}
