import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiStandardResponses } from './api-standard-responses.decorator';

/**
 * @ApiList('entidade')
 * @ApiGet('entidade')
 * @ApiCreate('entidade')
 * @ApiUpdate('entidade')
 * @ApiDelete('entidade')
 */

export function ApiList(entity: string) {
    return applyDecorators(
        ApiOperation({ summary: `Lista de ${entity}` }),
        ApiResponse({ status: 200, description: `Lista de ${entity} retornada com sucesso` }),
        ApiStandardResponses(),
    );
}

export function ApiGet(entity: string) {
    return applyDecorators(
        ApiOperation({ summary: `Detalhes de ${entity}` }),
        ApiResponse({ status: 200, description: `Detalhes de ${entity} retornados com sucesso` }),
        ApiStandardResponses(),
    );
}

export function ApiCreate(entity: string) {
    return applyDecorators(
        ApiOperation({ summary: `Criação de ${entity}` }),
        ApiResponse({ status: 201, description: `${entity} criado com sucesso` }),
        ApiStandardResponses(),
    );
}

export function ApiUpdate(entity: string) {
    return applyDecorators(
        ApiOperation({ summary: `Atualização de ${entity}` }),
        ApiResponse({ status: 200, description: `${entity} atualizado com sucesso` }),
        ApiStandardResponses(),
    );
}

export function ApiDelete(entity: string) {
    return applyDecorators(
        ApiOperation({ summary: `Deletar ${entity}` }),
        ApiResponse({ status: 204, description: `${entity} excluído com sucesso` }),
        ApiStandardResponses(),
    );
}
