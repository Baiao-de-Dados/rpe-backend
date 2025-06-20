import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiCreate, ApiGet } from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { RequireEmployer, RequireRH } from 'src/auth/decorators/roles.decorator';

@ApiTags('Avaliações')
@ApiAuth()
@Controller('evaluations')
export class EvaluationsController {
    constructor(private readonly evaluationsService: EvaluationsService) {}

    @RequireEmployer()
    @Post()
    @ApiCreate('avaliação')
    create(@Body() createEvaluationDto: CreateEvaluationDto) {
        return this.evaluationsService.createEvaluation(createEvaluationDto);
    }

    @RequireRH()
    @Get()
    @ApiGet('avaliações')
    findAll() {
        return this.evaluationsService.findAll();
    }

    @RequireRH()
    @Get(':id')
    @ApiGet('avaliação')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.evaluationsService.findOne(id);
    }
}
