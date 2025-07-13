import { UserRole } from '@prisma/client';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { GeminiRequestDto } from '../dto/request/gemini-request-dto';

export function GeminiCollaboratorEndpoint() {
    return applyDecorators(
        ApiTags('Inteligência Artificial'),
        ApiBearerAuth(),
        ExactRoles(
            UserRole.EMPLOYER,
            UserRole.MANAGER,
            UserRole.LEADER,
            UserRole.COMMITTEE,
            UserRole.RH,
        ),
        ApiOperation({
            summary: 'Gerar resumo automático do desempenho do colaborador em um ciclo',
            description:
                'Recebe userId/cycleId, busca dados das avaliações de um colaborador e retorna um resumo/feedback gerada pela IA. Apenas EMPLOYER, MANAGER, LEADER, COMMITTEE, RH podem acessar.',
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
                                'Você teve um desempenho bastante consistente ao longo do ciclo. Sua proatividade, senso de responsabilidade e colaboração com o time foram pontos muito valorizados nas avaliações — tanto pelo gestor quanto refletidos na sua própria percepção. É nítido o cuidado que você tem com a qualidade das entregas e com a forma como se comunica com as pessoas ao seu redor. Um ponto que vale atenção para o próximo ciclo é desenvolver uma visão mais estratégica no planejamento das atividades e na gestão do tempo, especialmente em contextos de múltiplas demandas. De forma geral, você mostrou evolução contínua e está cada vez mais preparado para assumir desafios maiores. Parabéns pelo ciclo!',
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
            description:
                'Acesso negado. Apenas EMPLOYER, MANAGER, LEADER, COMMITTEE, RH podem acessar.',
        }),
        ApiResponse({ status: 500, description: 'Erro interno ou falha na IA.' }),
    );
}
