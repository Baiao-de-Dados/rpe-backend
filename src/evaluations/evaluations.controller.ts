import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiCreate, ApiGet } from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';

@ApiTags('Avaliações')
@ApiAuth()
@Controller('evaluations')
export class EvaluationsController {
    constructor(private readonly evaluationsService: EvaluationsService) {}

    @Public() // @lorenzochaves, @markfranca --> Precisa refatorar isto!
    @Post()
    @ApiCreate('avaliação')
    create(@Body() createEvaluationDto: CreateEvaluationDto) {
        return this.evaluationsService.createEvaluation(createEvaluationDto);
    }

    @Get()
    @ApiGet('avaliações')
    findAll() {
        return this.evaluationsService.findAll();
    }

    @Get(':id')
    @ApiGet('avaliação')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.evaluationsService.findOne(id);
    }
}
