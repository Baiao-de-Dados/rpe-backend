import { Injectable } from '@nestjs/common';
import ai from './init';
import {
    isValidGeminiNotesResponse,
    isValidNoInsightResponse,
    isValidNoIdentificationResponse,
    cleanGeminiResponseText,
} from './utils';
import { notesConfig } from './config';
import { colaboradores, criterios, mentor } from './mocks';
import { GeminiNotesResponseDto } from './dto/response/gemini-notes-response.dto';
import { NotesService } from '../notes/notes.service';
import { GeminiCollaboratorResponseDto } from './dto/response/gemini-collaborator-response.dto';
import { GeminiEqualizationResponseDto } from './dto/response/gemini-equalization-response.dto';
import { GeminiLeaderResponseDto } from './dto/response/gemini-leader-response.dto';

@Injectable()
export class AiService {
    constructor(private readonly notesService: NotesService) {}

    private generateNotesData(text: string, userId: number, cycleId: number): string {
        console.log(cycleId, userId);
        // TODO: Usar o userId e o cycledId para buscar no banco:
        // Os colaboladores que estão no projeto atual do colaborador,
        // O mentor do colaborador
        // Os critérios de avaliação da trilha do colaborador no ciclo
        return `

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

    private generateCollaboratorData(userId: number, cycleId: number): string {
        console.log(cycleId, userId);
        // TODO: Usar o userId e o cycledId para buscar no banco:
        // A autoavaliação do colaborador no ciclo, com seus pilares, critérios e pesos.
        // A avaliação do Gestor no ciclo com os mesmos critérios.
        // A nota final e justificativa que o comitê de equalização deu para o colaborador no ciclo
        // IMPORTANTE: Esse resumo só é gerado uma vez, então a endpoint tem que verificar se já existe um resumo para o usuário e ciclo. Se não exister, vai gerar e salvar no banco.
        return `

        [AUTOAVALIAÇÃO]
        ${'JSON.stringify(autoavaliacao, null, 2)'}
        [GESTOR]
        ${'JSON.stringify(gestor, null, 2)'}
        [EQUALIZAÇÃO]
        ${'JSON.stringify(equalizacao, null, 2)'}
        `;
    }

    private generateEqualizationData(userId: number, cycleId: number): string {
        console.log(cycleId, userId);
        // TODO: Usar o userId e o cycledId para buscar no banco:
        // A autoavaliação do colaborador no ciclo, com seus pilares, critérios e pesos.
        // As avaliações 360 que o colaborador recebeu, com as respectivas, notas, pontos fortes e pontos de melhoria
        // Se o colaborador for mentor de alguém você receberá a avaliação que o mentorado fez dele, com nota e justificativa
        // As referências que o colaborador recebeu, com justificativa
        // A avaliação do Gestor no ciclo com os mesmos critérios.
        // IMPORTANTE: Esse resumo só é gerado uma vez, então a endpoint tem que verificar se já existe um resumo para o usuário e ciclo. Se não exister, vai gerar e salvar no banco.
        return `

        [AUTOAVALIAÇÃO]
        ${'JSON.stringify(autoavaliacao, null, 2)'}
        [AVALIACAO360]
        ${'JSON.stringify(avaliacao360, null, 2)'}
        [MENTORADO]
        ${'JSON.stringify(mentorado, null, 2)'}
        [REFERENCIAS]
        ${'JSON.stringify(referencias, null, 2)'}
        [GESTOR]
        ${'JSON.stringify(gestor, null, 2)'}
        `;
    }

    private generateLeaderData(userId: number, cycleId: number): string {
        console.log(cycleId, userId);
        // TODO: Usar o userId e o cycledId para buscar no banco:
        // As autoavaliações dos colaboradores liderados, com seus respectivos pilares, critérios e pesos.
        // As avaliações que o líder deu para os seus liderados, com nota, justificativa, pontos fortes e de melhoria.
        // As avaliações do gestor, com os mesmos pilares e critérios da autoavaliação para cada colaborador.
        // As avaliações do comitê de equalização com a nota final e justificativa para cada colaborador.
        // IMPORTANTE: Esse resumo só é gerado uma vez, então a endpoint tem que verificar se já existe um resumo para o usuário e ciclo. Se não exister, vai gerar e salvar no banco.
        return `

        [AUTOAVALIAÇÕES]
        ${'JSON.stringify(autoavaliacoes, null, 2)'}
        [LIDER]
        ${'JSON.stringify(lider, null, 2)'}
        [GESTOR]
        ${'JSON.stringify(gestor, null, 2)'}
        [EQUALIZAÇÕES]
        ${'JSON.stringify(equalizacao, null, 2)'}
        `;
    }

    async gerarAvaliacaoPorAnotacoes(
        userId: number,
        cycleId: number,
    ): Promise<GeminiNotesResponseDto> {
        const { notes } = await this.notesService.getNoteByUserId(userId);
        const prompt = this.generateNotesData(notes, userId, cycleId);

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
            } else if (isValidGeminiNotesResponse(resumoObj as GeminiNotesResponseDto)) {
                const r = resumoObj as GeminiNotesResponseDto;
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

    async gerarResumoColaborador(
        userId: number,
        cycleId: number,
    ): Promise<GeminiCollaboratorResponseDto> {
        const prompt = this.generateCollaboratorData(userId, cycleId);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction: notesConfig.systemInstruction },
            });
            const resposta = cleanGeminiResponseText(response.text ?? '');
            if (!resposta) {
                return { code: 'ERROR', error: 'A resposta gerada está vazia ou inválida.' };
            }
            let obj: any;
            try {
                obj = JSON.parse(resposta);
            } catch {
                return { code: 'ERROR', error: 'Erro ao decodificar JSON' };
            }
            if (obj.code === 'NO_INSIGHT') {
                return { code: 'NO_INSIGHT' };
            }
            if (obj.code === 'SUCCESS') {
                return {
                    code: 'SUCCESS',
                    summary: obj.summary,
                };
            }
            return { code: 'ERROR', error: 'Formato inesperado.' };
        } catch (error) {
            console.error('Erro desconhecido:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao processar resumo.',
            };
        }
    }

    async gerarEqualization(
        userId: number,
        cycleId: number,
    ): Promise<GeminiEqualizationResponseDto> {
        const prompt = this.generateEqualizationData(userId, cycleId);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction: notesConfig.systemInstruction },
            });
            const resposta = cleanGeminiResponseText(response.text ?? '');
            if (!resposta) {
                return { code: 'ERROR', error: 'A resposta gerada está vazia ou inválida.' };
            }
            let obj: any;
            try {
                obj = JSON.parse(resposta);
            } catch {
                return { code: 'ERROR', error: 'Erro ao decodificar JSON' };
            }
            if (obj.code === 'NO_INSIGHT') {
                return { code: 'NO_INSIGHT' };
            }
            if (obj.code === 'SUCCESS') {
                return {
                    code: 'SUCCESS',
                    rating: obj.rating,
                    detailedAnalysis: obj.detailedAnalysis,
                    summary: obj.summary,
                    discrepancies: obj.discrepancies,
                };
            }
            return { code: 'ERROR', error: 'Formato inesperado.' };
        } catch (error) {
            console.error('Erro desconhecido:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao processar resumo.',
            };
        }
    }

    async gerarResumoLeader(userId: number, cycleId: number): Promise<GeminiLeaderResponseDto> {
        const prompt = this.generateLeaderData(userId, cycleId);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction: notesConfig.systemInstruction },
            });
            const resposta = cleanGeminiResponseText(response.text ?? '');
            if (!resposta) {
                return { code: 'ERROR', error: 'A resposta gerada está vazia ou inválida.' };
            }
            let obj: any;
            try {
                obj = JSON.parse(resposta);
            } catch {
                return { code: 'ERROR', error: 'Erro ao decodificar JSON' };
            }
            if (obj.code === 'NO_INSIGHT') {
                return { code: 'NO_INSIGHT' };
            }
            if (obj.code === 'SUCCESS') {
                return {
                    code: 'SUCCESS',
                    summary: obj.summary,
                };
            }
            return { code: 'ERROR', error: 'Formato inesperado.' };
        } catch (error) {
            console.error('Erro desconhecido:', error);
            return {
                code: 'ERROR',
                error: 'Erro interno ao processar resumo.',
            };
        }
    }
}