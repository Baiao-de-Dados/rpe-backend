import { UserRole } from '@prisma/client';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { GeminiRequestDto } from '../dto/request/gemini-request-dto';

export function GeminiEqualizationEndpoint() {
    return applyDecorators(
        ApiTags('Inteligência Artificial'),
        ApiBearerAuth(),
        ExactRoles(UserRole.COMMITTEE),
        ApiOperation({
            summary: 'Gerar resumo detalhado das avaliações do colaborador para a equalização',
            description:
                'Recebe userId/cycleId, busca dados das avaliações de um colaborador e retorna um resumo detalhado gerado pela IA indicando diferenças significativas. Apenas COMMITTEE pode acessar.',
        }),
        ApiBody({
            type: GeminiRequestDto,
            description: 'Payload contendo userId e cycleId',
            examples: {
                exemplo: {
                    value: {
                        userId: 1,
                        cycleId: 20251,
                    },
                },
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Resposta da IA: SUCCESS, NO_INSIGHT',
            schema: {
                oneOf: [
                    {
                        example: {
                            code: 'SUCCESS',
                            rating: 4,
                            detailedAnalysis:
                                'O colaborador apresentou desempenho consistente, com destaque para a colaboração técnica e entrega de resultados. Houve divergência entre autoavaliação e feedback do líder, justificada pela diferença de percepção sobre prazos.',
                            summary:
                                'Colaborador demonstra bom desempenho geral, com pequenas divergências entre avaliações.',
                            discrepancies:
                                'A autoavaliação foi superior ao feedback dos pares, indicando possível viés de autopercepção.',
                        },
                    },
                    { example: { code: 'NO_INSIGHT' } },
                ],
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Erro na resposta da IA ou processamento (ERROR)',
            schema: { example: { code: 'ERROR', error: 'Mensagem de erro detalhada' } },
        }),
        ApiResponse({ status: 403, description: 'Acesso negado. Apenas COMMITTEE pode acessar.' }),
        ApiResponse({ status: 500, description: 'Erro interno ou falha na IA.' }),
    );
}
