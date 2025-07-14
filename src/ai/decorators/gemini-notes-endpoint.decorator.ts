import { UserRole } from '@prisma/client';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { GeminiRequestDto } from '../dto/request/gemini-request-dto';

export function GeminiNotesEndpoint() {
    return applyDecorators(
        ApiTags('Inteligência Artificial'),
        ApiBearerAuth(),
        ExactRoles(UserRole.EMPLOYER),
        ApiOperation({
            summary: 'Gerar avaliações automaticamente baseadas nas anotações do colabolador',
            description:
                'Recebe o userId e o cycleId, busca as anotações do usuário e retorna uma avaliação gerada pela IA. Apenas EMPLOYER pode acessar.',
        }),
        ApiBody({
            type: GeminiRequestDto,
            description: 'Payload contendo o userId e cycleId',
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
            description: 'Resposta da IA: SUCCESS ou NO_INSIGHT',
            schema: {
                oneOf: [
                    {
                        example: {
                            code: 'SUCCESS',
                            selfAssessment: [
                                {
                                    pillarId: '12',
                                    criteriaId: 'gente',
                                    rating: 4,
                                    justification:
                                        'Tenho conseguido apoiar e guiar os colegas nas atividades do time, principalmente em momentos mais desafiadores.',
                                },
                            ],
                            evaluation360: [
                                {
                                    collaboratorId: 'colab-001',
                                    rating: 4,
                                    strengths:
                                        'Ele tem um olhar criativo que contribui muito no início dos projetos',
                                    improvements: 'Às vezes poderia ser mais ágil nas entregas',
                                },
                            ],
                            mentoring: {
                                rating: 5,
                                justification:
                                    'Miguel sempre me ajuda a enxergar o cenário com mais clareza quando estou diante de uma decisão difícil.',
                            },
                            references: [
                                {
                                    collaboratorId: 'colab-001',
                                    justification:
                                        'Ele tem um perfil técnico muito forte e sempre traz soluções práticas e bem embasadas.',
                                },
                            ],
                        },
                    },
                    {
                        example: {
                            code: 'NO_INSIGHT',
                        },
                    },
                    {
                        example: {
                            code: 'NO_IDENTIFICATION',
                            written: 'João',
                            applicable: ['João Silva', 'João Souza'],
                        },
                    },
                ],
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Erro na resposta da IA ou processamento (ERROR)',
            schema: {
                example: {
                    code: 'ERROR',
                    error: 'Mensagem de erro detalhada',
                },
            },
        }),
        ApiResponse({
            status: 403,
            description: 'Acesso negado. Apenas EMPLOYER pode acessar.',
        }),
        ApiResponse({
            status: 500,
            description: 'Erro interno ou falha na IA.',
        }),
    );
}
