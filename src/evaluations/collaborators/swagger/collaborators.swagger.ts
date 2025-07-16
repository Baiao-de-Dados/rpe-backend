import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';

export function ApiGetCollaboratorsScores() {
    return applyDecorators(
        ApiTags('Colaboradores'),
        ApiOperation({
            summary: 'Obter as notas de todos os colaboradores',
            description:
                'Retorna as notas de todos os colaboradores, incluindo avaliações e trilhas.',
        }),
        ApiQuery({
            name: 'cycleId',
            required: false,
            description: 'ID do ciclo de avaliação para filtrar os colaboradores (opcional)',
        }),
        ApiResponse({
            status: 200,
            description: 'Lista de colaboradores com suas avaliações retornada com sucesso.',
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', example: 1 },
                        name: { type: 'string', example: 'João Silva' },
                        email: { type: 'string', example: 'joao.silva@empresa.com' },
                        position: { type: 'string', example: 'Desenvolvedor' },
                        track: { type: 'string', example: 'Backend' },
                        evaluations: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number', example: 1 },
                                    cycleConfigId: { type: 'number', example: 1 },
                                    createdAt: {
                                        type: 'string',
                                        example: '2023-01-01T00:00:00.000Z',
                                    },
                                    updatedAt: {
                                        type: 'string',
                                        example: '2023-01-02T00:00:00.000Z',
                                    },
                                    autoEvaluation: { type: 'object', example: null },
                                    evaluation360: { type: 'array', example: [] },
                                    mentoring: { type: 'object', example: null },
                                    reference: { type: 'array', example: [] },
                                    cycleConfig: { type: 'object', example: null },
                                },
                            },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 403,
            description: 'Acesso negado. Apenas usuários autorizados podem acessar este recurso.',
        }),
    );
}

export function ApiGetCollaboratorEvaluation() {
    return applyDecorators(
        ApiTags('Colaboradores'),
        ApiOperation({
            summary: 'Obter as avaliações de um colaborador',
            description: 'Retorna as avaliações feitas por um colaborador específico.',
        }),
        ApiParam({
            name: 'collaboratorId',
            required: true,
            description: 'ID do colaborador para buscar as avaliações',
        }),
        ApiResponse({
            status: 200,
            description: 'Avaliações do colaborador retornadas com sucesso.',
        }),
        ApiResponse({
            status: 404,
            description: 'Colaborador não encontrado ou sem avaliações.',
        }),
    );
}

export function ApiGetCollaboratorEvaluationHistory() {
    return applyDecorators(
        ApiTags('Colaboradores'),
        ApiOperation({
            summary: 'Obter o histórico de avaliações de um colaborador',
            description: 'Retorna o histórico de avaliações de um colaborador específico.',
        }),
        ApiParam({
            name: 'collaboratorId',
            required: true,
            description: 'ID do colaborador para buscar o histórico de avaliações',
        }),
        ApiResponse({
            status: 200,
            description: 'Histórico de avaliações do colaborador retornado com sucesso.',
        }),
        ApiResponse({
            status: 404,
            description: 'Colaborador não encontrado ou sem histórico de avaliações.',
        }),
    );
}
