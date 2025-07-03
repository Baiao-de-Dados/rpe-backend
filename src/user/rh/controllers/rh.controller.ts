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
import { CreatePillarDto } from 'src/pillars/dto/create-pillar.dto';
import { UpdatePillarDto } from 'src/pillars/dto/update-pillar.dto';
import { CreateCriterionDto } from 'src/criteria/dto/create-criterion.dto';
import { CreateCycleConfigDto } from 'src/cycle-config/dto/create-cycle-config.dto';
import { UpdateCriterionDto } from 'src/criteria/dto/update-criterion.dto';
import { UpdateCycleConfigDto } from 'src/cycle-config/dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from 'src/cycle-config/dto/cycle-config-response.dto';
import { CreatePillarTrackConfigDto } from 'src/pillars/dto/create-pillar-track-config.dto';
import { UpdatePillarTrackConfigDto } from 'src/pillars/dto/update-pillar-track-config.dto';

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

    @Post('pillar/track-config')
    @ApiCreate('Pilar por trilha')
    async createPillarTrackConfig(@Body() dto: CreatePillarTrackConfigDto) {
        await this.rh.validateCycleActive();
        return this.rh.createPillarTrackConfig(dto);
    }

    @Post('pillar/track-config/all')
    @ApiList('Pilares por trilha')
    async findAllPillarTrackConfigs() {
        return this.rh.findAllPillarTrackConfigs();
    }

    @Get('pillar/track-config/filter')
    @ApiGet('Pilar por trilha')
    async findTrackCOnfigsByFilter(@Query('track') track: string) {
        return this.rh.findPillarTracksConfigByFilter(track);
    }

    @Get('pillar/track-config/user/:userId')
    @ApiGet('Usuário por trilha')
    async findActivePillarsForUser(@Param('userId', ParseIntPipe) userId: number) {
        return this.rh.findActivePillarsForUser(userId);
    }

    @Patch('pillar/track-config/:pillarId')
    @ApiUpdate('Pilar por trilha')
    async updatePillarTrackConfig(
        @Param('pillarId', ParseIntPipe) pillarId: number,
        @Body() dto: UpdatePillarTrackConfigDto,
        @Query('track') track: string,
    ) {
        await this.rh.validateCycleActive();
        return this.rh.updatePillarTrackConfig(pillarId, track, dto);
    }

    @Delete('pillar/track-config/:pillarId')
    @ApiDelete('Pilar po')

    // Critérios
    @Post('criteria')
    @ApiCreate('Critério')
    createCriterion(@Body() dto: CreateCriterionDto) {
        return this.rh.createCriterion(dto);
    }

    @Get('criteria')
    @ApiList('Critérios')
    findAllCriteria() {
        return this.rh.findAllCriteria();
    }

    @Get('criteria/:id')
    @ApiGet('Critério')
    findOneCriterion(@Param('id', ParseIntPipe) id: number) {
        return this.rh.findOneCriterion(id);
    }

    @Put('criteria/:id')
    @ApiGet('Critério')
    updateCriterion(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCriterionDto) {
        return this.rh.updateCriterion(id, dto);
    }

    @Delete('criteria/:id')
    @ApiDelete('Critério')
    deleteCriterion(@Param('id', ParseIntPipe) id: number) {
        return this.rh.deleteCriterion(id);
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
