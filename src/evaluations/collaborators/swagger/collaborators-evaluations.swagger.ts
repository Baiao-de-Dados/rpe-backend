import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

export function ApiGetCollaboratorEvaluations() {
    return applyDecorators(
        ApiTags('Colaboradores'),
        ApiOperation({
            summary: 'Obter todas as avaliações feitas por um colaborador',
            description: 'Retorna todas as avaliações feitas por um colaborador, incluindo autoavaliação, avaliação 360, mentoria e referências.',
        }),
        ApiQuery({
            name: 'collaboratorId',
            required: true,
            description: 'ID do colaborador para buscar as avaliações feitas por ele',
        }),
        ApiResponse({
            status: 200,
            description: 'Lista de avaliações feitas pelo colaborador retornada com sucesso.',
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        cycleName: { type: 'string', example: '2024.2' },
                        selfAssessment: {
                            type: 'object',
                            properties: {
                                pillars: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            pillarName: { type: 'string', example: 'Comportamento' },
                                            criteria: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        criteriaName: { type: 'string', example: 'Sentimento de Dono' },
                                                        rating: { type: 'number', example: 5 },
                                                        weight: { type: 'number', example: 20 },
                                                        managerRating: { type: 'number', example: 5 },
                                                        justification: {
                                                            type: 'string',
                                                            example: 'Excelente desempenho nesta área.',
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        evaluation360: {
                            type: 'object',
                            properties: {
                                evaluation: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            collaratorName: { type: 'string', example: 'John Doe' },
                                            collaboratorPosition: { type: 'string', example: 'Manager' },
                                            rating: { type: 'number', example: 4 },
                                            improvements: {
                                                type: 'string',
                                                example: 'Precisa melhorar as habilidades de comunicação.',
                                            },
                                            strengths: {
                                                type: 'string',
                                                example: 'Bom desempenho geral, mas há áreas para melhoria.',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        reference: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    collaratorName: { type: 'string', example: 'John Doe' },
                                    collaboratorPosition: { type: 'string', example: 'Manager' },
                                    justification: { type: 'string', example: 'Justificativa' },
                                },
                            },
                        },
                        mentoring: {
                            type: 'object',
                            properties: {
                                rating: { type: 'number', example: 4 },
                                justification: {
                                    type: 'string',
                                    example: 'A mentoria foi eficaz, fornecendo orientações valiosas.',
                                },
                                mentorName: { type: 'string', example: 'Luan Kato' },
                            },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 404,
            description: 'Nenhuma avaliação encontrada para o colaborador especificado.',
        }),
    );
}
