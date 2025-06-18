import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CriteriaService } from './criteria.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';

@ApiTags('Critérios')
@Controller('criteria')
export class CriteriaController {
    constructor(private readonly criteriaService: CriteriaService) {}

    @Post()
    @ApiOperation({ summary: 'Criar um novo critério' })
    @ApiResponse({
        status: 201,
        description: 'Critério criado com sucesso',
    })
    create(@Body() createCriterionDto: CreateCriterionDto) {
        return this.criteriaService.create(createCriterionDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os critérios' })
    @ApiResponse({
        status: 200,
        description: 'Lista de critérios retornada com sucesso',
    })
    findAll() {
        return this.criteriaService.findAll();
    }

    @Get('pillar/:pillarId')
    @ApiOperation({ summary: 'Listar critérios por pilar' })
    @ApiResponse({
        status: 200,
        description: 'Critérios do pilar retornados com sucesso',
    })
    findByPillar(@Param('pillarId', ParseIntPipe) pillarId: number) {
        return this.criteriaService.findByPillar(pillarId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar um critério por ID' })
    @ApiResponse({
        status: 200,
        description: 'Critério encontrado com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Critério não encontrado',
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.criteriaService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar um critério' })
    @ApiResponse({
        status: 200,
        description: 'Critério atualizado com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Critério não encontrado',
    })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateCriterionDto: UpdateCriterionDto) {
        return this.criteriaService.update(id, updateCriterionDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover um critério' })
    @ApiResponse({
        status: 200,
        description: 'Critério removido com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Critério não encontrado',
    })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.criteriaService.remove(id);
    }
}
