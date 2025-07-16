import { Controller, Get, Param, ParseIntPipe, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { OnlyCommittee } from 'src/auth/decorators/roles.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { CommitteeService } from './committee.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SaveEqualizationDto } from './dto/save-equalization.dto';
import { CommitteeDashboardMetrics, CommitteeCollaboratorsSummary, CommitteeCollaboratorDetails } from './swagger/committee.swagger';

@ApiTags('Comitê')
@ApiAuth()
@OnlyCommittee()
@Controller('committee')
export class CommitteeController {
    constructor(private readonly committeeService: CommitteeService) {}

    @Get('dashboard/metrics')
    @ApiOperation({
        summary: 'Buscar métricas do dashboard do comitê',
        description: 'Retorna métricas gerais sobre equalizações pendentes e completadas',
    })
    @ApiResponse({
        status: 200,
        description: 'Métricas do dashboard',
        type: CommitteeDashboardMetrics,
    })
    async getDashboardMetrics(@CurrentUser('id') committeeId: number) {
        return this.committeeService.getDashboardMetrics(committeeId);
    }

    @Get('dashboard/collaborators-summary')
    @ApiOperation({
        summary: 'Buscar resumo dos colaboradores para equalização',
        description: 'Retorna lista de colaboradores com suas notas e status de equalização',
    })
    @ApiResponse({
        status: 200,
        description: 'Resumo dos colaboradores',
        type: [CommitteeCollaboratorsSummary],
    })
    async getCollaboratorsSummary(@CurrentUser('id') committeeId: number) {
        return this.committeeService.getCollaboratorsSummary(committeeId);
    }

    @Get('collaborator/:collaboratorId/evaluation-details')
    @ApiOperation({
        summary: 'Buscar detalhes completos da avaliação de um colaborador',
        description: 'Retorna todos os dados de avaliação de um colaborador específico',
    })
    @ApiResponse({
        status: 200,
        description: 'Detalhes da avaliação do colaborador',
        type: CommitteeCollaboratorDetails,
    })
    @ApiResponse({
        status: 404,
        description: 'Colaborador não encontrado',
    })
    async getCollaboratorEvaluationDetails(
        @Param('collaboratorId', ParseIntPipe) collaboratorId: number,
        @CurrentUser('id') committeeId: number,
        @Query('cycleConfigId', ParseIntPipe) cycleConfigId: number,
    ) {
        return this.committeeService.getCollaboratorEvaluationDetails(committeeId, collaboratorId, cycleConfigId);
    }

    @Get('equalization/:collaboratorId')
    @ApiOperation({
        summary: 'Buscar equalização de um colaborador',
        description: 'Retorna a equalização do comitê para um colaborador em um ciclo específico',
    })
    @ApiResponse({
        status: 200,
        description: 'Equalização encontrada',
        schema: {
            example: {
                id: 123,
                collaboratorId: 20,
                cycleId: 1,
                committeeId: 5,
                score: 4.5,
                justification: 'Nota final após análise de todas as avaliações do colaborador',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                committee: {
                    id: 5,
                    name: 'João Silva',
                    position: 'Membro do Comitê'
                }
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Equalização não encontrada',
    })
    async getEqualization(
        @Param('collaboratorId', ParseIntPipe) collaboratorId: number,
        @CurrentUser('id') committeeId: number,
        @Query('cycleConfigId', ParseIntPipe) cycleConfigId: number,
    ) {
        return this.committeeService.getEqualization(committeeId, collaboratorId, cycleConfigId);
    }

    @Get('equalization/:collaboratorId/history')
    @ApiOperation({
        summary: 'Buscar histórico de equalização de um colaborador',
        description: 'Retorna o histórico completo de mudanças na equalização de um colaborador',
    })
    @ApiResponse({
        status: 200,
        description: 'Histórico de equalização',
        schema: {
            example: [
                {
                    id: 1,
                    equalizationId: 123,
                    committeeId: 5,
                    previousScore: 4.0,
                    newScore: 4.5,
                    previousJustification: 'Nota inicial',
                    newJustification: 'Nota final após análise',
                    changeReason: 'Revisão após feedback do manager',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    committee: {
                        id: 5,
                        name: 'João Silva',
                        position: 'Membro do Comitê'
                    }
                }
            ]
        }
    })
    async getEqualizationHistory(
        @Param('collaboratorId', ParseIntPipe) collaboratorId: number,
        @CurrentUser('id') committeeId: number,
        @Query('cycleConfigId', ParseIntPipe) cycleConfigId: number,
    ) {
        return this.committeeService.getEqualizationHistory(committeeId, collaboratorId, cycleConfigId);
    }

    @Post('equalization')
    @ApiOperation({
        summary: 'Salvar equalização de um colaborador',
        description: 'Cria ou atualiza a equalização de um colaborador em um ciclo específico',
    })
    @ApiResponse({
        status: 201,
        description: 'Equalização salva com sucesso',
        schema: {
            example: {
                message: 'Equalização criada com sucesso',
                equalization: {
                    id: 123,
                    collaboratorId: 3,
                    cycleId: 6,
                    committeeId: 5,
                    score: 4.5,
                    justification: 'Nota final após análise de todas as avaliações do colaborador',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z',
                    committee: {
                        id: 5,
                        name: 'João Silva',
                        position: 'Membro do Comitê'
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Dados inválidos',
    })
    @ApiBody({
        schema: {
            example: {
                cycleConfigId: 6,
                collaboratorId: 3,
                equalization: {
                    score: 4.5,
                    justification: 'Nota final após análise de todas as avaliações do colaborador',
                    changeReason: 'Revisão após feedback do manager' // opcional
                }
            }
        }
    })
    async saveEqualization(
        @Body() dto: SaveEqualizationDto,
        @CurrentUser('id') committeeId: number,
    ) {
        return this.committeeService.saveEqualization(dto, committeeId);
    }
} 