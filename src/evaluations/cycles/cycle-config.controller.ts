import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CycleConfigService } from './cycle-config.service';
import { CreateCycleConfigDto } from './dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from './dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from './dto/cycle-config-response.dto';
import { RequireRH } from '../../auth/decorators/roles.decorator';
import { ApiAuth } from '../../common/decorators/api-auth.decorator';
import { ApiCreate } from '../../common/decorators/api-crud.decorator';

@ApiTags('Configuração de Ciclo')
@ApiAuth()
@Controller('cycle-config')
export class CycleConfigController {
    constructor(private readonly cycleConfigService: CycleConfigService) {}

    @Post()
    @RequireRH()
    @ApiCreate('ciclo de avaliação')
    async create(@Body() createCycleConfigDto: CreateCycleConfigDto) {
        // Validar se não há ciclo ativo antes de criar um novo
        await this.cycleConfigService.validateCycleNotActive();

        return this.cycleConfigService.create(createCycleConfigDto);
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

    @Put(':id')
    @RequireRH()
    @ApiOperation({ summary: 'Atualizar ciclo de avaliação' })
    @ApiResponse({ status: 200, type: CycleConfigResponseDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCycleConfigDto: UpdateCycleConfigDto,
    ): Promise<CycleConfigResponseDto> {
        // Validar se não há ciclo ativo antes de fazer alterações
        await this.cycleConfigService.validateCycleNotActive();

        return this.cycleConfigService.update(id, updateCycleConfigDto);
    }

    @Delete(':id')
    @RequireRH()
    @ApiOperation({ summary: 'Remover ciclo de avaliação' })
    @ApiResponse({ status: 200, description: 'Ciclo removido com sucesso' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        // Validar se não há ciclo ativo antes de fazer alterações
        await this.cycleConfigService.validateCycleNotActive();

        return this.cycleConfigService.remove(id);
    }
}
