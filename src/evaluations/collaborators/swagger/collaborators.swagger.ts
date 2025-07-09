import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export function ApiGetCollaboratorsScores() {
    return applyDecorators(
        ApiTags('Colaboradores'),
        ApiOperation({
            summary: 'Obter as notas de todos os colaboradores',
            description:
                'Retorna as notas de autoavaliação, avaliação 360, gestor e equalização final de todos os colaboradores.',
        }),
        ApiResponse({
            status: 200,
            description: 'Lista de colaboradores com suas avaliações.',
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'João Silva' },
                        track: { type: 'string', example: 'Backend' },
                        position: { type: 'string', example: 'Desenvolvedor' },
                        evaluations: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    cycleId: { type: 'number', example: 1 },
                                    track: { type: 'string', example: 'Backend' },
                                    autoEvaluationScore: { type: 'number', example: 4.5 },
                                    evaluation360Score: { type: 'number', example: 4.0 },
                                    mentoringScore: { type: 'number', example: 4.2 },
                                    finalEqualizationScore: { type: 'string', example: 'Excelente desempenho' },
                                },
                            },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 403,
            description: 'Acesso negado. Apenas usuários com o papel RH podem acessar este recurso.',
        }),
    );
}
