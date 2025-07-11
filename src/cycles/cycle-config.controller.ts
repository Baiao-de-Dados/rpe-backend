import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequireRH } from '../auth/decorators/roles.decorator';
import { ApiAuth } from '../common/decorators/api-auth.decorator';
import {
    ApiCreate,
    ApiDelete,
    ApiGet,
    ApiList,
    ApiUpdate,
} from '../common/decorators/api-crud.decorator';
import { CycleConfigService } from './cycle-config.service';
import { CreateCycleConfigDto } from './dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from './dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from './dto/cycle-config-response.dto';
import { ExtendCycleDto } from './dto/extend-cycle.dto';

@ApiTags('Configuração de Ciclo')
@ApiAuth()
@RequireRH()
@Controller('cycle-config')
export class CycleConfigController {
    constructor(private readonly cycleConfigService: CycleConfigService) {}

    @Post()
    @ApiCreate('ciclo de avaliação')
    async create(@Body() createCycleConfigDto: CreateCycleConfigDto) {
        // Validar se não há ciclo ativo antes de criar um novo
        await this.cycleConfigService.validateCycleNotActive();
        return this.cycleConfigService.create(createCycleConfigDto);
    }

    @Get()
    @ApiList('ciclos')
    async findAll(): Promise<CycleConfigResponseDto[]> {
        return this.cycleConfigService.findAll();
    }

    @Get('active')
    @ApiOperation({ summary: 'Buscar ciclo ativo' })
    @ApiGet('ciclo ativo')
    async findActive(): Promise<CycleConfigResponseDto | null> {
        return this.cycleConfigService.findActive();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar ciclo por ID' })
    @ApiGet('ciclo')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CycleConfigResponseDto> {
        return this.cycleConfigService.findOne(id);
    }

    @Put(':id')
    @ApiUpdate('ciclo')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCycleConfigDto: UpdateCycleConfigDto,
    ): Promise<CycleConfigResponseDto> {
        // Validar se não há ciclo ativo antes de fazer alterações
        await this.cycleConfigService.validateCycleNotActive();
        return this.cycleConfigService.update(id, updateCycleConfigDto);
    }

    @Delete(':id')
    @ApiDelete('ciclo')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.cycleConfigService.remove(id);
    }

    @Put(':id/cancel')
    @ApiUpdate('ciclo')
    async cancelCycle(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.cycleConfigService.cancelCycle(id);
    }

    @Put(':id/extend')
    @ApiUpdate('ciclo')
    async extendCycle(
        @Param('id', ParseIntPipe) id: number,
        @Body() extendCycleDto: ExtendCycleDto,
    ): Promise<CycleConfigResponseDto> {
        return this.cycleConfigService.extendCycle(id, extendCycleDto);
    }
}
