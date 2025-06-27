import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiStandardResponses } from '../../common/decorators/api-standard-responses.decorator';

/**
 * Decorators específicos para endpoints de usuário
 * @ApiProfile()
 * @ApiAssignRole()
 * @ApiRemoveRole()
 */

export function ApiProfile() {
    return applyDecorators(
        ApiOperation({ summary: 'Buscar perfil do usuário logado' }),
        ApiResponse({ status: 200, description: 'Perfil do usuário encontrado' }),
        ApiStandardResponses(),
    );
}

export function ApiAssignRole() {
    return applyDecorators(
        ApiOperation({ summary: 'Atribuir role ao usuário (apenas Admin)' }),
        ApiResponse({ status: 201, description: 'Role atribuída com sucesso' }),
        ApiResponse({ status: 400, description: 'Usuário já possui esta função' }),
        ApiResponse({ status: 404, description: 'Usuário não encontrado' }),
        ApiStandardResponses(),
    );
}

export function ApiRemoveRole() {
    return applyDecorators(
        ApiOperation({ summary: 'Remover role do usuário (apenas Admin)' }),
        ApiResponse({ status: 200, description: 'Role removida com sucesso' }),
        ApiResponse({ status: 404, description: 'Usuário não possui esta função' }),
        ApiStandardResponses(),
    );
}
