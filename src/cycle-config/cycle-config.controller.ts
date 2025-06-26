import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CycleConfigService } from './cycle-config.service';
import { CreateCycleConfigDto } from './dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from './dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from './dto/cycle-config-response.dto';
import { RequireRH } from '../auth/decorators/roles.decorator';
import { ApiAuth } from '../common/decorators/api-auth.decorator';

@ApiTags('Configuração de Ciclo')
@ApiAuth()
@Controller('cycle-config')
export class CycleConfigController {
    constructor(private readonly cycleConfigService: CycleConfigService) {}

    @RequireRH()
    @Post()
    @ApiOperation({ summary: 'Criar ciclo de avaliação' })
    @ApiResponse({ status: 201, type: CycleConfigResponseDto })
    async create(@Body() dto: CreateCycleConfigDto): Promise<CycleConfigResponseDto> {
        return this.cycleConfigService.create(dto);
    }

    @RequireRH()
    @Get()
    @ApiOperation({ summary: 'Listar todos os ciclos' })
    @ApiResponse({ status: 200, type: [CycleConfigResponseDto] })
    async findAll(): Promise<CycleConfigResponseDto[]> {
        return this.cycleConfigService.findAll();
    }

    @RequireRH()
    @Get('active')
    @ApiOperation({ summary: 'Buscar ciclo ativo' })
    @ApiResponse({ status: 200, type: CycleConfigResponseDto })
    async findActive(): Promise<CycleConfigResponseDto | null> {
        return this.cycleConfigService.findActive();
    }

    @RequireRH()
    @Get(':id')
    @ApiOperation({ summary: 'Buscar ciclo por ID' })
    @ApiResponse({ status: 200, type: CycleConfigResponseDto })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CycleConfigResponseDto> {
        return this.cycleConfigService.findOne(id);
    }

    @RequireRH()
    @Put(':id')
    @ApiOperation({ summary: 'Atualizar ciclo' })
    @ApiResponse({ status: 200, type: CycleConfigResponseDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCycleConfigDto,
    ): Promise<CycleConfigResponseDto> {
        return this.cycleConfigService.update(id, dto);
    }

    @RequireRH()
    @Delete(':id')
    @ApiOperation({ summary: 'Remover ciclo' })
    @ApiResponse({ status: 204 })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.cycleConfigService.remove(id);
    }
}
