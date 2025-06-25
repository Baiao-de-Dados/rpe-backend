import { Controller, Post, Body, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiCreate, ApiGet } from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { RequireEmployer, RequireRH, RequireLeader } from 'src/auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Avaliações')
@ApiAuth()
@Controller('evaluations')
export class EvaluationsController {
    constructor(
        private readonly evaluationsService: EvaluationsService,
        private readonly prisma: PrismaService,
    ) {}

    @RequireEmployer()
    @RequireLeader()
    @Post()
    @ApiCreate('avaliação')
    create(@Body() createEvaluationDto: CreateEvaluationDto) {
        return this.evaluationsService.createEvaluation(createEvaluationDto);
    }

    @RequireRH()
    @Get()
    @ApiGet('avaliações')
    findAll(@Query('type') type?: string) {
        if (type) {
            return this.evaluationsService.findByType(type);
        }
        return this.evaluationsService.findAll();
    }

    @RequireRH()
    @Get(':id')
    @ApiGet('avaliação')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.evaluationsService.findOne(id);
    }

    @RequireRH()
    @Get('type/:type')
    @ApiGet('avaliações por tipo')
    findByType(@Param('type') type: string) {
        return this.evaluationsService.findByType(type);
    }

    @RequireRH()
    @Get('peer360')
    @ApiGet('avaliações peer 360')
    findAllPeer360() {
        return this.evaluationsService.findByType('PEER_360');
    }

    @RequireRH()
    @Get('leader')
    @ApiGet('avaliações de líder')
    findAllLeader() {
        return this.evaluationsService.findByType('LEADER');
    }

    @RequireRH()
    @Get('mentor')
    @ApiGet('avaliações de mentor')
    findAllMentor() {
        return this.evaluationsService.findByType('MENTOR');
    }

    @RequireRH()
    @Get('auto')
    @ApiGet('autoavaliações')
    findAllAuto() {
        return this.evaluationsService.findByType('AUTOEVALUATION');
    }

    @RequireRH()
    @Get('peer360/:evaluateeId')
    @ApiGet('avaliações peer 360 por avaliado')
    findPeer360ByEvaluatee(@Param('evaluateeId', ParseIntPipe) evaluateeId: number) {
        return this.evaluationsService.findByTypeAndEvaluatee('PEER_360', evaluateeId);
    }

    @RequireRH()
    @Get('leader/:evaluateeId')
    @ApiGet('avaliações de líder por avaliado')
    findLeaderByEvaluatee(@Param('evaluateeId', ParseIntPipe) evaluateeId: number) {
        return this.evaluationsService.findByTypeAndEvaluatee('LEADER', evaluateeId);
    }

    @RequireRH()
    @Get('mentor/:evaluateeId')
    @ApiGet('avaliações de mentor por avaliado')
    findMentorByEvaluatee(@Param('evaluateeId', ParseIntPipe) evaluateeId: number) {
        return this.evaluationsService.findByTypeAndEvaluatee('MENTOR', evaluateeId);
    }

    @RequireRH()
    @Get('auto/:evaluateeId')
    @ApiGet('autoavaliações por usuário')
    findAutoByEvaluatee(@Param('evaluateeId', ParseIntPipe) evaluateeId: number) {
        return this.evaluationsService.findByTypeAndEvaluatee('AUTOEVALUATION', evaluateeId);
    }

    @RequireLeader()
    @Get('by-evaluator/:evaluatorId')
    @ApiGet('avaliações por avaliador')
    findByEvaluator(
        @Param('evaluatorId', ParseIntPipe) evaluatorId: number,
        @Query('type') type?: string,
    ) {
        if (type) {
            return this.evaluationsService.findByTypeAndEvaluator(type, evaluatorId);
        }
        // Se não especificar tipo, retorna todas as avaliações do avaliador
        return this.evaluationsService.findByTypeAndEvaluator('LEADER', evaluatorId);
    }
}
