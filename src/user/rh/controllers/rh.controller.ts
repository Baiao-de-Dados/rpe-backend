import {
    ApiCreate,
    ApiDelete,
    ApiGet,
    ApiList,
    ApiUpdate,
} from 'src/common/decorators/api-crud.decorator';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { RequireRH } from 'src/auth/decorators/roles.decorator';
import { RHService } from '../services/rh.service';
import { ApiTags } from '@nestjs/swagger';
import { RHUserDTO } from '../dto/rh.dto';
import { CreatePillarDto } from 'src/evaluations/autoevaluations/pillar/dto/create-pillar.dto';
import { UpdatePillarDto } from 'src/evaluations/autoevaluations/pillar/dto/update-pillar.dto';
import { CreateCriterionDto } from 'src/evaluations/autoevaluations/criteria/dto/create-criterion.dto';
import { CreateCycleConfigDto } from 'src/evaluations/cycles/dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from 'src/evaluations/cycles/dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from 'src/evaluations/cycles/dto/cycle-config-response.dto';
import { BatchUpdateCriteriaDto } from 'src/evaluations/autoevaluations/criteria/dto/batch-update-criteria.dto';
import { TrackConfigResponseDto } from 'src/evaluations/autoevaluations/criteria/dto/track-config-response.dto';
import { UpdateCriterionTrackConfigDto } from 'src/evaluations/autoevaluations/criteria/dto/update-criterion-track-config.dto';
import { TrackConfigDto } from 'src/evaluations/autoevaluations/criteria/dto/track-config.dto';

@ApiTags('Admin RH')
@ApiAuth()
@RequireRH()
@Controller('rh')
export class RHController {
    constructor(private readonly rh: RHService) {}

    // Pilares
    @Post('pillar')
    @ApiCreate('Pilar')
    async createPillar(@Body() dto: CreatePillarDto) {
        await this.rh.validateCycleActive();
        return this.rh.createPillar(dto);
    }

    @Get('pillar')
    @ApiList('Pilares')
    async findAllPillars() {
        return this.rh.findAllPillars();
    }

    @Get('pillar/:id')
    @ApiGet('Pilar')
    async findOnePillar(@Param('id', ParseIntPipe) id: number) {
        return this.rh.findOnePillar(id);
    }

    @Put('pillar/:id')
    @ApiUpdate('Pilar')
    async updatePillar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePillarDto) {
        return this.rh.updatePillar(id, dto);
    }

    @Delete('pillar/:id')
    @ApiDelete('Pilar')
    async deletePillar(@Param('id', ParseIntPipe) id: number) {
        await this.rh.validateCycleActive();
        return this.rh.deletePillar(id);
    }
    // Critérios
    @Post('criteria')
    @ApiCreate('Critério')
    async createCriterion(@Body() dto: CreateCriterionDto) {
        await this.rh.validateCycleActive();
        return this.rh.createCriterion(dto);
    }

    @Get('criteria')
    @ApiList('Critérios')
    findAllCriteria() {
        return this.rh.findAllCriteria();
    }

    @Get('criteria/pillar/:pillarId')
    @ApiGet('Critérios por pilar')
    findCriterionByPillar(@Param('pillarId', ParseIntPipe) pillarId: number) {
        return this.rh.findCriterionByPillar(pillarId);
    }

    @Get('criteria/:id')
    @ApiGet('Critério')
    findOneCriterion(@Param('id', ParseIntPipe) id: number) {
        return this.rh.findOneCriterion(id);
    }

    @Patch('criteria/:id')
    @ApiUpdate('Critério')
    async batchUpdateCriterion(@Body() dto: BatchUpdateCriteriaDto) {
        return this.rh.batchUpdateCriteria(dto);
    }

    @Delete('criteria/:id')
    @ApiDelete('Critério')
    deleteCriterion(@Param('id', ParseIntPipe) id: number) {
        return this.rh.deleteCriterion(id);
    }

    @Get('criteria/track-config/all')
    @ApiList('Critérios por trilha')
    async findAllCriteriaTracksConfigs(): Promise<TrackConfigResponseDto[]> {
        return this.rh.findAllCriteriaTracksConfigs();
    }

    @Get('criteria/track-config/filter/:trackId')
    @ApiGet('Filtro de Critérios por trilha')
    async findCriteriaTrackConfigsByFilter(
        @Query('track', ParseIntPipe) trackId: number,
    ): Promise<TrackConfigResponseDto> {
        return this.rh.findCriteriaTracksConfigsByTrack(trackId);
    }

    @Get('criteria/track-config/user/:userId')
    @ApiGet('Critérios ativos para Usuário')
    async findActiveCriteriaPerUser(
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<TrackConfigResponseDto> {
        return this.rh.findActiveCriteriaPerUser(userId);
    }

    @Patch('criteria/track-config/:criterionId')
    @ApiUpdate('Configuração de Critérios por trilha')
    async updateCriteriaTrackConfig(
        @Param('criterionId', ParseIntPipe) criterionId: number,
        @Query('track', ParseIntPipe) trackId: number,
        @Body() dto: UpdateCriterionTrackConfigDto,
    ) {
        return this.rh.updateCriteriaTrackConfig(criterionId, trackId, dto);
    }

    @Delete('criteria/track-config/:criterionId')
    @ApiDelete('Configuração de Critérios por trilha')
    async deleteCriteriaTrackConfig(
        @Param('criterionId', ParseIntPipe) criterionId: number,
        @Query('track', ParseIntPipe) trackId: number,
    ) {
        return this.rh.deleteCriteriaTrackConfig(criterionId, trackId);
    }

    @Post('criteria/track-config')
    @ApiCreate('Configuração de critérios por trilha em lote')
    async createCriteriaConfigBulk(@Body() trackConfigs: TrackConfigDto[]) {
        return await this.rh.createCriteriaTrackConfigBulk(trackConfigs);
    }

    // Ciclo
    @Post('cycle')
    @ApiCreate('Ciclo')
    async createCycle(@Body() dto: CreateCycleConfigDto) {
        await this.rh.validateCycleActive();
        return this.rh.createCycle(dto);
    }

    @Get('cycle')
    @ApiList('Ciclos')
    async findAllCycles(): Promise<CycleConfigResponseDto[]> {
        return this.rh.findAllCycles();
    }

    @Get('cycle/active')
    @ApiGet('ciclo ativo')
    async findActive(): Promise<CycleConfigResponseDto | null> {
        return this.rh.findActiveCycle();
    }

    @Get('cycle/:id')
    @ApiGet('Ciclo')
    async findOneCycle(@Param('id', ParseIntPipe) id: number): Promise<CycleConfigResponseDto> {
        return this.rh.findOneCycle(id);
    }

    @Put('cycle/:id')
    @ApiUpdate('Ciclo')
    async updateCycle(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCycleConfigDto,
    ): Promise<CycleConfigResponseDto> {
        await this.rh.validateCycleActive();
        return this.rh.updateCycle(id, dto);
    }

    @Delete('cycle/:id')
    @ApiDelete('Ciclo')
    async deleteCycle(@Param('id', ParseIntPipe) id: number) {
        await this.rh.validateCycleActive();
        return this.rh.deleteCycle(id);
    }

    // Usuário do tipo RH
    @Get()
    @ApiList('usuários RH')
    async findAll(): Promise<RHUserDTO[]> {
        return this.rh.findAll();
    }

    @Get(':id')
    @ApiGet('usuário RH')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<RHUserDTO> {
        return this.rh.findOne(id);
    }
}
