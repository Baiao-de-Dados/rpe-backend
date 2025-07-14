import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CycleConfigService } from './cycle-config.service';
import { CreateCycleConfigDto } from '../cycles/dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from './dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from './dto/cycle-config-response.dto';
import { RequireRH } from 'src/auth/decorators/roles.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { ApiCreate } from 'src/common/decorators/api-crud.decorator';
import { ExtendCycleDto } from './dto/extend-cycle.dto';

@ApiTags('Configuração de Ciclo')
@ApiAuth()
@Controller('cycle-config')
export class CycleConfigController {
    constructor(private readonly cycleConfigService: CycleConfigService) {}

    @Post()
    @RequireRH()
    @ApiCreate('ciclo de avaliação')
    async create(@Body() createCycleConfigDto: CreateCycleConfigDto) {
        // await this.cycleConfigService.validateCycleNotActive();
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
        // await this.cycleConfigService.validateCycleNotActive();
        return this.cycleConfigService.update(id, updateCycleConfigDto);
    }

    @Delete(':id')
    @RequireRH()
    @ApiOperation({ summary: 'Remover ciclo de avaliação' })
    @ApiResponse({ status: 200, description: 'Ciclo removido com sucesso' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        // await this.cycleConfigService.validateCycleNotActive();
        return this.cycleConfigService.remove(id);
    }

    @Post(':id/extend')
    @ApiOperation({ summary: 'Prorrogar ciclo ativo' })
    @ApiResponse({ status: 200, description: 'Ciclo prorrogado com sucesso' })
    @ApiResponse({ status: 400, description: 'Ciclo não está ativo ou data inválida' })
    @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
    async extendCycle(
        @Param('id', ParseIntPipe) id: number,
        @Body() extendCycleDto: ExtendCycleDto,
    ) {
        return await this.cycleConfigService.extendCycle(id, extendCycleDto);
    }

    @Delete(':id/cancel')
    @RequireRH()
    @ApiOperation({ summary: 'Cancelar ciclo ativo' })
    @ApiResponse({ status: 200, description: 'Ciclo cancelado com sucesso' })
    @ApiResponse({ status: 400, description: 'Ciclo não está ativo' })
    @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
    async cancelCycle(@Param('id', ParseIntPipe) id: number) {
        return this.cycleConfigService.cancelCycle(id);
    }

    @Post(':id/done')
    @ApiOperation({ summary: 'Finalizar ciclo (seta done = true)' })
    @ApiResponse({ status: 200, description: 'Ciclo finalizado com sucesso' })
    async finalizeCycle(@Param('id', ParseIntPipe) id: number) {
        return this.cycleConfigService.finalizeCycle(id);
    }
}
