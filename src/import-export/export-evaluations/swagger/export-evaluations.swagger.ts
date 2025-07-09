import { applyDecorators } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

export function ApiExportEvaluations() {
    return applyDecorators(
        ApiTags('Exportação'),
        ApiOperation({ summary: 'Exportar avaliações de equalização para um arquivo Excel' }),
        ApiQuery({
            name: 'cycleId',
            required: true,
            description: 'ID do ciclo de avaliação para exportar os dados',
        }),
        ApiConsumes('application/json'),
        ApiResponse({
            status: 200,
            description: 'Arquivo Excel gerado com sucesso.',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Erro na validação do parâmetro ou ciclo não encontrado.',
        }),
        ApiResponse({
            status: 404,
            description: 'Nenhuma avaliação encontrada para o ciclo especificado.',
        }),
    );
}
