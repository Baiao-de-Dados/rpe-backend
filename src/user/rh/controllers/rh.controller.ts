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

@ApiTags('Admin RH')
@ApiAuth()
@Controller('rh/')
export class RHController {
    constructor(private readonly rh: RHService) {}

    // Usuário do tipo RH
    @RequireRH()
    @Get()
    @ApiList('usuários RH')
    async findAll(): Promise<RHUserDTO[]> {
        return this.rh.findAll();
    }

    @RequireRH()
    @Get(':id')
    @ApiGet('usuário RH')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<RHUserDTO> {
        return this.rh.findOne(id);
    }

    // Pilares
    @RequireRH()
    @Post('pillars')
    @ApiCreate('Pilar')
    createPillar(@Body() dto: CreatePillarDto) {
        return this.rh.createPillar(dto);
    }

    @RequireRH()
    @Put('pillars/:id')
    @ApiUpdate('Pillar')
    updatePillar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePillarDto) {
        return this.rh.updatePillar(id, dto);
    }

    @RequireRH()
    @Delete('pillars/:id')
    @ApiDelete('Pilar')
    deletePillar(@Param('id', ParseIntPipe) id: number) {
        return this.rh.deletePillar(id);
    }

    // Critérios
    @RequireRH()
    @Post('criteria')
    @ApiCreate('Critério')
    createCriterion(@Body() dto: CreateCriterionDto) {
        return this.rh.createCriterion(dto);
    }

    // Ciclo
    @RequireRH()
    @Post('cycle')
    @ApiCreate('Ciclo')
    createCycle(@Body() dto: CreateCycleConfigDto) {
        return this.rh.createCycle(dto);
    }
}
