import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CriteriaService } from './criteria.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionTrackConfigDto } from './dto/update-criterion-track-config.dto';
import { BatchUpdateCriteriaDto } from './dto/batch-update-criteria.dto';
import { TrackConfigDto } from './dto/track-config.dto';
import { TrackConfigResponseDto } from './dto/track-config-response.dto';
import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
    ApiCreate,
    ApiUpdate,
    ApiGet,
    ApiList,
    ApiDelete,
} from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { CycleConfigService } from 'src/evaluations/cycles/cycle-config.service';

@ApiTags('Critérios')
@ApiAuth()
@Controller('criteria')
export class CriteriaController {
    constructor(
        private readonly criteriaService: CriteriaService,
        private readonly cycleConfigService: CycleConfigService,
    ) {}

    @Post()
    @ExactRoles(UserRole.RH)
    @ApiCreate('critério')
    async create(@Body() createCriterionDto: CreateCriterionDto) {
        // Validar se não há ciclo ativo antes de criar critérios
        await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.create(createCriterionDto);
    }

    @Get()
    @ExactRoles(UserRole.RH)
    @ApiList('critérios')
    findAll() {
        return this.criteriaService.findAll();
    }

    @Get('pillar/:pillarId')
    @ExactRoles(UserRole.RH)
    @ApiGet('critérios por pilar')
    findByPillar(@Param('pillarId', ParseIntPipe) pillarId: number) {
        return this.criteriaService.findByPillar(pillarId);
    }

    @Get(':id')
    @ExactRoles(UserRole.RH)
    @ApiGet('critério')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.criteriaService.findOne(id);
    }

    @Patch()
    @ExactRoles(UserRole.RH)
    @ApiUpdate('critérios em lote')
    async batchUpdate(@Body() batchUpdateDto: BatchUpdateCriteriaDto) {
        // Validar se não há ciclo ativo antes de atualizar critérios
        //await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.batchUpdate(batchUpdateDto);
    }

    @Delete(':id')
    @ExactRoles(UserRole.RH)
    @ApiDelete('critério')
    async remove(@Param('id', ParseIntPipe) id: number) {
        // Validar se não há ciclo ativo antes de remover critérios
        //await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.remove(id);
    }

    @Get('track-config/all')
    @ExactRoles(UserRole.RH)
    @ApiList('configurações de critérios por trilha')
    async findAllTrackConfigs(): Promise<TrackConfigResponseDto[]> {
        return this.criteriaService.findAllTrackConfigs();
    }

    @Get('track-config/filter')
    @ExactRoles(UserRole.RH)
    @ApiGet('configurações de critérios por trilha filtradas')
    async findTrackConfigsByFilter(
        @Query('track', ParseIntPipe) trackId: number,
    ): Promise<TrackConfigResponseDto> {
        return this.criteriaService.findTrackConfigsByTrack(trackId);
    }

    /*
    @Get('track-config/user/:userId')
    @ExactRoles(UserRole.RH)
    @ApiGet('critérios ativos para usuário')
    async findActiveCriteriaForUser(
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<TrackConfigResponseDto> {
        return this.criteriaService.findActiveCriteriaForUser(userId);
    }
    */

    @Patch('track-config/:criterionId')
    @ExactRoles(UserRole.RH)
    @ApiUpdate('configuração de critério por trilha')
    async updateTrackConfig(
        @Param('criterionId', ParseIntPipe) criterionId: number,
        @Body() updateConfigDto: UpdateCriterionTrackConfigDto,
        @Query('track', ParseIntPipe) trackId: number,
    ) {
        return this.criteriaService.updateTrackConfig(criterionId, trackId, updateConfigDto);
    }

    @Delete('track-config/:criterionId')
    @ExactRoles(UserRole.RH)
    @ApiDelete('configuração de critério por trilha')
    async removeTrackConfig(
        @Param('criterionId', ParseIntPipe) criterionId: number,
        @Query('track', ParseIntPipe) trackId: number,
    ) {
        return this.criteriaService.removeTrackConfig(criterionId, trackId);
    }

    @Post('track-config')
    @ExactRoles(UserRole.RH)
    @ApiCreate('configuração de critérios por trilha em lote')
    @ApiBody({ type: TrackConfigDto, isArray: true })
    async createTrackConfigBulk(@Body() trackConfigs: TrackConfigDto[]) {
        return await this.criteriaService.createTrackConfigBulk(trackConfigs);
    }

    @Post('track-cycle-config')
    @ExactRoles(UserRole.RH)
    @ApiOperation({
        summary:
            'Iniciar ciclo: copiar configs de CriterionTrackConfig para CriterionTrackCycleConfig',
    })
    @ApiBody({
        schema: {
            properties: {
                endDate: { type: 'string', format: 'date-time', example: '2025-12-31T23:59:59Z' },
            },
        },
    })
    async createTrackCycleConfig(@Body('endDate') endDate: string) {
        return this.criteriaService.createTrackCycleConfigFromDraft(endDate);
    }

    @Get('cycle-history/:cycleId')
    @ApiOperation({ summary: 'Listar histórico de configurações de critério por ciclo' })
    @ApiResponse({ status: 200, description: 'Histórico de configurações retornado com sucesso' })
    @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
    async getCycleHistory(@Param('cycleId', ParseIntPipe) cycleId: number) {
        return await this.criteriaService.getCycleHistory(cycleId);
    }
}
