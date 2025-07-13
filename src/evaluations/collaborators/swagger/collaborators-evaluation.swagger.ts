import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

export function ApiGetCollaboratorEvaluationCommittee() {
    return applyDecorators(
        ApiTags('Colaboradores'),
        ApiOperation({
            summary: 'Obter dados de avaliação de um colaborador para o Comitê',
            description: 'Retorna os dados de avaliação de um colaborador para o Comitê.',
        }),
        ApiQuery({
            name: 'cycleId',
            required: true,
            description: 'ID do ciclo de avaliação',
        }),
        ApiQuery({
            name: 'collaboratorId',
            required: true,
            description: 'ID do colaborador',
        }),
        ApiResponse({
            status: 200,
            description: 'Dados de avaliação do colaborador retornados com sucesso.',
        }),
        ApiResponse({
            status: 404,
            description: 'Nenhuma avaliação encontrada para o colaborador no ciclo especificado.',
        }),
    );
}

export function ApiGetCollaboratorEvaluationManager() {
    return applyDecorators(
        ApiTags('Colaboradores'),
        ApiOperation({
            summary: 'Obter dados de avaliação de um colaborador para o Gestor',
            description: 'Retorna os dados de avaliação de um colaborador para o Gestor.',
        }),
        ApiQuery({
            name: 'cycleId',
            required: true,
            description: 'ID do ciclo de avaliação',
        }),
        ApiQuery({
            name: 'collaboratorId',
            required: true,
            description: 'ID do colaborador',
        }),
        ApiResponse({
            status: 200,
            description: 'Dados de avaliação do colaborador retornados com sucesso.',
        }),
        ApiResponse({
            status: 404,
            description: 'Nenhuma avaliação encontrada para o colaborador no ciclo especificado.',
        }),
    );
}
