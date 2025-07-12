import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PillarsService } from './pillars.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';
import { ApiCreate, ApiDelete, ApiGet, ApiUpdate } from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { OnlyRH } from 'src/auth/decorators/roles.decorator';
import { CycleConfigService } from 'src/evaluations/cycles/cycle-config.service';

@ApiTags('Pilares')
@ApiAuth()
@Controller('pillars')
export class PillarsController {
    constructor(
        private readonly pillarsService: PillarsService,
        private readonly cycleConfigService: CycleConfigService,
    ) {}

    @OnlyRH()
    @Post()
    @ApiCreate('pilar')
    async create(@Body() createPillarDto: CreatePillarDto) {
        return this.pillarsService.create(createPillarDto);
    }

    @OnlyRH()
    @Get()
    @ApiGet('pilares')
    findAll() {
        return this.pillarsService.findAll();
    }

    @OnlyRH()
    @Get(':id')
    @ApiGet('pilar')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pillarsService.findOne(id);
    }

    @OnlyRH()
    @Patch(':id')
    @ApiUpdate('pilar')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updatePillarDto: UpdatePillarDto) {
        return this.pillarsService.update(id, updatePillarDto);
    }

    @OnlyRH()
    @Delete(':id')
    @ApiDelete('pilar')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.pillarsService.remove(id);
    }
}
