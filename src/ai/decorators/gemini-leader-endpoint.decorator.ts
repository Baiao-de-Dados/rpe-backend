import { UserRole } from '@prisma/client';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { GeminiRequestDto } from '../dto/request/gemini-request-dto';

export function GeminiLeaderEndpoint() {
    return applyDecorators(
        ApiTags('Inteligência Artificial'),
        ApiBearerAuth(),
        ExactRoles(UserRole.LEADER, UserRole.MANAGER),
        ApiOperation({
            summary: 'Gerar resumo do desempenho dos liderados para o líder',
            description:
                'Recebe userId/cycleId, busca dados dos liderados e retorna resumo gerado pela IA. Apenas LEADER e MANAGER podem acessar.',
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
                            summary:
                                'É perceptível que o time apresentou desempenho consistente em comunicação e entrega, com boa colaboração entre os membros. A maioria dos colaboradores demonstra alinhamento entre a autoavaliação, sua avaliação e a nota final, o que reforça a confiabilidade dos feedbacks. Contudo, há discrepâncias importantes em alguns casos, especialmente nas avaliações relacionadas à gestão do tempo, onde colaboradores tendem a se autoavaliar com notas mais altas do que as recebidas de você e na avaliação final. Áreas como autonomia e proatividade também apresentam variações entre as fontes, indicando oportunidades para alinhamento e desenvolvimento focado. Recomenda-se atenção especial a esses pontos para promover maior consistência e evolução no próximo ciclo.',
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
        ApiResponse({
            status: 403,
            description: 'Acesso negado. Apenas LEADER e MANAGER podem acessar.',
        }),
        ApiResponse({ status: 500, description: 'Erro interno ou falha na IA.' }),
    );
}
