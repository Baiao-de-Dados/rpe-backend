import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiStandardResponses } from './api-standard-responses.decorator';

/**
 * Decorators para endpoints de log
 * @ApiLogList()
 * @ApiLogCreate()
 */

export function ApiLogList() {
    return applyDecorators(
        ApiOperation({ summary: 'Listagem de logs do sistema' }),
        ApiResponse({ status: 200, description: 'Lista de logs retornada com sucesso' }),
        ApiStandardResponses(),
    );
}

export function ApiLogCreate() {
    return applyDecorators(
        ApiOperation({ summary: 'Criação de log manual' }),
        ApiResponse({ status: 201, description: 'Log criado com sucesso' }),
        ApiStandardResponses(),
    );
}
