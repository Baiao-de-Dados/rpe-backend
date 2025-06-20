import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

export function ApiAuth() {
    return applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiUnauthorizedResponse({ description: 'Não autorizado' }),
        ApiForbiddenResponse({ description: 'Acesso negado' }),
    );
}
