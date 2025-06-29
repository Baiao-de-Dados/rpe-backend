import {
    ApiCreate,
    ApiDelete,
    ApiGet,
    ApiList,
    ApiUpdate,
} from 'src/common/decorators/api-crud.decorator';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
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

@ApiTags('Admin RH')
@ApiAuth()
@RequireRH()
@Controller('rh')
export class RHController {
    constructor(private readonly rh: RHService) {}

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

    // Pilares
    @Post('pillars')
    @ApiCreate('Pilar')
    createPillar(@Body() dto: CreatePillarDto) {
        return this.rh.createPillar(dto);
    }

    @Get('pillars')
    @ApiList('Pilares')
    findAllPillars() {
        return this.rh.findAllPillars();
    }

    @Get('pillars/:id')
    @ApiGet('Pilar')
    findOnePillar(@Param('id', ParseIntPipe) id: number) {
        return this.rh.findOnePillar(id);
    }

    @Put('pillars/:id')
    @ApiUpdate('Pilar')
    updatePillar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePillarDto) {
        return this.rh.updatePillar(id, dto);
    }

    @Delete('pillars/:id')
    @ApiDelete('Pilar')
    deletePillar(@Param('id', ParseIntPipe) id: number) {
        return this.rh.deletePillar(id);
    }

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
    createCycle(@Body() dto: CreateCycleConfigDto) {
        return this.rh.createCycle(dto);
    }

    @Get('cycles')
    @ApiList('Ciclos')
    findAllCycles() {
        return this.rh.findAllCycles();
    }

    @Get('cycles/:id')
    @ApiGet('Ciclo')
    findOneCycle(@Param('id', ParseIntPipe) id: number) {
        return this.rh.findOneCycle(id);
    }

    @Put('cycles/:id')
    @ApiUpdate('Ciclo')
    updateCycle(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCycleConfigDto) {
        return this.rh.updateCycle(id, dto);
    }

    @Delete('cycles/:id')
    @ApiDelete('Ciclo')
    deleteCycle(@Param('id', ParseIntPipe) id: number) {
        return this.rh.deleteCycle(id);
    }
}
