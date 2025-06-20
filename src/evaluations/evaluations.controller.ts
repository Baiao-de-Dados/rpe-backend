import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Avaliações')
@Controller('evaluations')
@ApiBearerAuth('JWT-auth')
export class EvaluationsController {
    constructor(private readonly evaluationsService: EvaluationsService) {}

    @Public()
    @Post()
    @ApiOperation({ summary: 'Criar uma nova avaliação' })
    @ApiResponse({
        status: 201,
        description: 'Avaliação criada com sucesso',
    })
    @ApiResponse({
        status: 400,
        description: 'Dados inválidos',
    })
    create(@Body() createEvaluationDto: CreateEvaluationDto) {
        return this.evaluationsService.createEvaluation(createEvaluationDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas as avaliações' })
    @ApiResponse({
        status: 200,
        description: 'Lista de avaliações retornada com sucesso',
    })
    findAll() {
        return this.evaluationsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar uma avaliação por ID' })
    @ApiResponse({
        status: 200,
        description: 'Avaliação encontrada com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Avaliação não encontrada',
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.evaluationsService.findOne(id);
    }
}
