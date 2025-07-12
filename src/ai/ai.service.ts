import { Injectable } from '@nestjs/common';
import ai from './init';
import {
    isValidGeminiEvaluationResponse,
    isValidNoInsightResponse,
    isValidNoIdentificationResponse,
    cleanGeminiResponseText,
} from './utils';
import { notesConfig } from './config';
import { colaboradores, criterios, mentor } from './mocks';
import { GeminiNotesEvaluationResponseDto } from './dto/gemini-notes-evaluation-response.dto';

@Injectable()
export class AiService {
    private generateNotesData(text: string, cycleId: number): string {
        console.log(cycleId);
        return `
        Você é um especialista em avaliação de desempenho com foco em análise comportamental baseada em evidências reais. Sua função é gerar avaliações automáticas e responsáveis a partir das anotações do cotidiano de um colaborador seguindo tudo que foi detalhado.

        [COLABORADORES]
        ${JSON.stringify(colaboradores, null, 2)}
        [CRITERIOS]
        ${JSON.stringify(criterios, null, 2)}
        [MENTOR]
        ${JSON.stringify(mentor, null, 2)}
        [TEXTO]
        ${text}
        `;
    }

    async gerarAvaliacaoPorAnotacoes(
        text: string,
        cycleId: number,
    ): Promise<GeminiNotesEvaluationResponseDto> {
        const prompt = this.generateNotesData(text, cycleId);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: notesConfig.systemInstruction,
                    temperature: notesConfig.temperature,
                    topP: notesConfig.topP,
                    maxOutputTokens: notesConfig.maxOutputTokens,
                    responseMimeType: notesConfig.responseMimeType,
                    thinkingConfig: notesConfig.thinkingConfig,
                },
            });

            const resposta = cleanGeminiResponseText(response.text ?? '');

            if (!resposta) {
                return {
                    code: 'ERROR',
                    error: 'A resposta gerada está vazia ou inválida.',
                };
            }

            let resumoObj: unknown;
            try {
                resumoObj = JSON.parse(resposta);
            } catch {
                return {
                    code: 'ERROR',
                    error: 'Erro ao decodificar JSON',
                };
            }

            if (isValidNoInsightResponse(resumoObj)) {
                return { code: 'NO_INSIGHT' };
            } else if (isValidNoIdentificationResponse(resumoObj)) {
                const obj = resumoObj as { written: string; applicable: string[] };
                return {
                    code: 'NO_IDENTIFICATION',
                    written: obj.written,
                    applicable: Array.isArray(obj.applicable) ? obj.applicable : [],
                };
            } else if (
                isValidGeminiEvaluationResponse(resumoObj as GeminiNotesEvaluationResponseDto)
            ) {
                const r = resumoObj as GeminiNotesEvaluationResponseDto;
                return {
                    code: 'SUCCESS',
                    selfAssessment: Array.isArray(r.selfAssessment) ? r.selfAssessment : [],
                    evaluation360: Array.isArray(r.evaluation360) ? r.evaluation360 : [],
                    mentoring:
                        typeof r.mentoring === 'object' || r.mentoring === null
                            ? r.mentoring
                            : null,
                    references: Array.isArray(r.references) ? r.references : [],
                };
            } else {
                return {
                    code: 'ERROR',
                    error: 'Resposta da IA fora do padrão esperado.',
                };
            }
        } catch (error) {
            console.error('Erro desconhecido:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao processar a avaliação.',
            };
        }
    }
}
