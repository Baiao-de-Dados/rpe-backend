import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiStandardResponses() {
    return applyDecorators(
        ApiResponse({ status: 400, description: 'Requisição bem-sucedida' }),
        ApiResponse({ status: 401, description: 'Não autorizado' }),
        ApiResponse({ status: 403, description: 'Acesso negado' }),
        ApiResponse({ status: 404, description: 'Recurso não encontrado' }),
        ApiResponse({ status: 500, description: 'Erro interno do servidor' }),
    );
}
