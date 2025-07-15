import { applyDecorators } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

export function ApiImportEvaluations() {
    return applyDecorators(
        ApiTags('Importação'),
        ApiOperation({
            summary: 'Importar avaliações de um arquivo Excel',
            description:
                'Permite importar avaliações de colaboradores a partir de um arquivo Excel no formato .xlsx.',
        }),
        ApiConsumes('multipart/form-data'), // Especifica que o endpoint aceita arquivos
        ApiBody({
            description: 'Arquivo Excel no formato .xlsx contendo as avaliações',
            required: true,
            schema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary',
                        description: 'Arquivo Excel (.xlsx)',
                    },
                },
            },
        }),
        ApiResponse({
            status: 201,
            description: 'Avaliações importadas com sucesso.',
        }),
        ApiResponse({
            status: 400,
            description: 'Erro de validação ou arquivo inválido.',
        }),
        ApiResponse({
            status: 401,
            description: 'Usuário não autenticado.',
        }),
        ApiResponse({
            status: 403,
            description: 'Usuário não autorizado.',
        }),
    );
}
