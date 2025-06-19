import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PillarsService } from './pillars.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';

@ApiTags('Pilares')
@Controller('pillars')
export class PillarsController {
    constructor(private readonly pillarsService: PillarsService) {}

    @Post()
    @ApiOperation({ summary: 'Criar um novo pilar' })
    @ApiResponse({
        status: 201,
        description: 'Pilar criado com sucesso',
    })
    create(@Body() createPillarDto: CreatePillarDto) {
        return this.pillarsService.create(createPillarDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os pilares' })
    @ApiResponse({
        status: 200,
        description: 'Lista de pilares retornada com sucesso',
    })
    findAll() {
        return this.pillarsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar um pilar por ID' })
    @ApiResponse({
        status: 200,
        description: 'Pilar encontrado com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Pilar não encontrado',
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pillarsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar um pilar' })
    @ApiResponse({
        status: 200,
        description: 'Pilar atualizado com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Pilar não encontrado',
    })
    update(@Param('id', ParseIntPipe) id: number, @Body() updatePillarDto: UpdatePillarDto) {
        return this.pillarsService.update(id, updatePillarDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover um pilar' })
    @ApiResponse({
        status: 200,
        description: 'Pilar removido com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Pilar não encontrado',
    })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.pillarsService.remove(id);
    }
}
