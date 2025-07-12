import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';

import { AiService } from './ai.service';

import { GeminiRequestDto } from './dto/request/gemini-request-dto';
import { GeminiNotesResponseDto } from './dto/response/gemini-notes-response.dto';
import { GeminiLeaderResponseDto } from './dto/response/gemini-leader-response.dto';
import { GeminiCollaboratorResponseDto } from './dto/response/gemini-collaborator-response.dto';
import { GeminiEqualizationResponseDto } from './dto/response/gemini-equalization-response.dto';

import { GeminiNotesEndpoint } from './decorators/gemini-notes-endpoint.decorator';
import { GeminiLeaderEndpoint } from './decorators/gemini-leader-endpoint.decorator';
import { GeminiCollaboratorEndpoint } from './decorators/gemini-collaborator-endpoint.decorator';
import { GeminiEqualizationEndpoint } from './decorators/gemini-equalization-endpoint.decorator';

@ApiTags('Inteligência Artificial')
@ApiBearerAuth()
@Controller('ia')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Post('analisar-anotacoes')
    @GeminiNotesEndpoint()
    async GeminiRequest(@Body() body: GeminiRequestDto, @Res() res: Response): Promise<void> {
        const result: GeminiNotesResponseDto = await this.aiService.gerarAvaliacaoPorAnotacoes(
            body.userId,
            body.cycleId,
        );
        if (
            result.code === 'SUCCESS' ||
            result.code === 'NO_INSIGHT' ||
            result.code === 'NO_IDENTIFICATION'
        ) {
            res.status(HttpStatus.OK).json(result);
            return;
        }
        res.status(HttpStatus.BAD_REQUEST).json(result);
    }

    @Post('analisar-colaborador')
    @GeminiCollaboratorEndpoint()
    async GeminiCollaborator(@Body() body: GeminiRequestDto, @Res() res: Response): Promise<void> {
        const result: GeminiCollaboratorResponseDto = await this.aiService.gerarResumoColaborador(
            body.userId,
            body.cycleId,
        );
        if (result.code === 'SUCCESS' || result.code === 'NO_INSIGHT') {
            res.status(HttpStatus.OK).json(result);
            return;
        }
        res.status(HttpStatus.BAD_REQUEST).json(result);
    }

    @Post('resumir-equalizacao')
    @GeminiEqualizationEndpoint()
    async GeminiEqualization(@Body() body: GeminiRequestDto, @Res() res: Response): Promise<void> {
        const result: GeminiEqualizationResponseDto = await this.aiService.gerarEqualization(
            body.userId,
            body.cycleId,
        );
        if (result.code === 'SUCCESS' || result.code === 'NO_INSIGHT') {
            res.status(HttpStatus.OK).json(result);
            return;
        }
        res.status(HttpStatus.BAD_REQUEST).json(result);
    }

    @Post('analisar-liderados')
    @GeminiLeaderEndpoint()
    async GeminiLeader(@Body() body: GeminiRequestDto, @Res() res: Response): Promise<void> {
        const result: GeminiLeaderResponseDto = await this.aiService.gerarResumoLeader(
            body.userId,
            body.cycleId,
        );
        if (result.code === 'SUCCESS' || result.code === 'NO_INSIGHT') {
            res.status(HttpStatus.OK).json(result);
            return;
        }
        res.status(HttpStatus.BAD_REQUEST).json(result);
    }
}
