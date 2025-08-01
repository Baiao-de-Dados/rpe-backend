import { Controller, Get, Param, ParseIntPipe, Post, Body, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { OnlyCommittee } from 'src/auth/decorators/roles.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { CommitteeService } from './committee.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SaveEqualizationDto } from './dto/save-equalization.dto';
import { CommitteeDashboardMetrics, CommitteeCollaboratorsSummary, CommitteeCollaboratorDetails } from './swagger/committee.swagger';
import { CycleConfigService } from 'src/cycles/cycle-config.service';

@ApiTags('Comitê')
@ApiAuth()

@Controller('committee')
export class CommitteeController {
    constructor(
        private readonly committeeService: CommitteeService,
        private readonly cycleConfigService: CycleConfigService,
    ) {}

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
    @OnlyCommittee()
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
    @OnlyCommittee()
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
    @OnlyCommittee()
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
        description: 'Cria ou atualiza a equalização de um colaborador em um ciclo específico. O aiSummary deve ser gerado previamente usando o endpoint de IA.',
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
                    aiSummary: 'Análise detalhada gerada pela IA sobre o desempenho do colaborador...',
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
                    changeReason: 'Revisão após feedback do manager', // opcional
                    aiSummary: 'Resumo da IA (opcional, gerado pelo endpoint de IA)' // opcional
                }
            }
        }
    })
    @OnlyCommittee()
    async saveEqualization(
        @Body() dto: SaveEqualizationDto,
        @CurrentUser('id') committeeId: number,
    ) {
        return this.committeeService.saveEqualization(dto, committeeId);
    }

    @Post('equalization/:collaboratorId/generate-ai-summary')
    @ApiOperation({
        summary: 'Gerar resumo da IA para equalização',
        description: 'Gera um resumo detalhado da IA baseado nas avaliações do colaborador para auxiliar na equalização. O resumo é salvo automaticamente no banco.',
    })
    @ApiResponse({
        status: 200,
        description: 'Resumo da IA gerado e salvo com sucesso',
        schema: {
            example: {
                code: 'SUCCESS',
                rating: 4,
                detailedAnalysis: 'O colaborador apresentou desempenho consistente, com destaque para a colaboração técnica e entrega de resultados. Houve divergência entre autoavaliação e feedback do líder, justificada pela diferença de percepção sobre prazos.',
                summary: 'Colaborador demonstra bom desempenho geral, com pequenas divergências entre avaliações.',
                discrepancies: 'A autoavaliação foi superior ao feedback dos pares, indicando possível viés de autopercepção.',
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Erro na geração do resumo da IA',
        schema: {
            example: {
                code: 'ERROR',
                error: 'Mensagem de erro detalhada'
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Colaborador ou ciclo não encontrado',
    })
    @OnlyCommittee()
    async generateAiSummary(
        @Param('collaboratorId', ParseIntPipe) collaboratorId: number,
        @CurrentUser('id') committeeId: number,
        @Query('cycleConfigId', ParseIntPipe) cycleConfigId: number,
    ) {
        return this.committeeService.generateAiSummary(committeeId, collaboratorId, cycleConfigId);
    }

    @Get('equalization/:collaboratorId/ai-summary')
    @ApiOperation({
        summary: 'Buscar resumo da IA salvo',
        description: 'Retorna o resumo da IA que foi gerado e salvo anteriormente para um colaborador',
    })
    @ApiResponse({
        status: 200,
        description: 'Resumo da IA encontrado',
        schema: {
            example: {
                id: 123,
                collaboratorId: 3,
                cycleId: 6,
                committeeId: 5,
                aiSummary: 'Análise detalhada gerada pela IA sobre o desempenho do colaborador...',
                score: null,
                justification: '',
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
        description: 'Resumo da IA não encontrado',
    })
    @OnlyCommittee()
    async getAiSummary(
        @Param('collaboratorId', ParseIntPipe) collaboratorId: number,
        @CurrentUser('id') committeeId: number,
        @Query('cycleConfigId', ParseIntPipe) cycleConfigId: number,
    ) {
        return this.committeeService.getAiSummary(committeeId, collaboratorId, cycleConfigId);
    }

    @Post('finish-equalization')
    @ApiOperation({
        summary: 'Finalizar equalização do ciclo',
        description: 'Seta o status do ciclo atual como "done", finalizando o processo de equalização,',
    })
    @ApiResponse({
        status: 200,
        description: 'Ciclo finalizado com sucesso',
        schema: {
            example: {
                id: 1,
                name: '2025.1',
                description: 'Ciclo de avaliação 2025.1',
                startDate: 2025011,
                endDate: 2025060,
                done: true,
                isActive: false,
                createdAt: 2025011,
                updatedAt: 2025011,
                criteriaPillars: []
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Ciclo ativo não encontrado',
    })
    @OnlyCommittee()
    async finishEqualization(@CurrentUser('id') committeeId: number) {
        // Buscar ciclo ativo
        const activeCycle = await this.committeeService.getActiveCycle();
        
        if (!activeCycle) {
            throw new NotFoundException('Nenhum ciclo ativo encontrado');
        }

        // Finalizar o ciclo
        return this.cycleConfigService.finalizeCycle(activeCycle.id);
    }
} 