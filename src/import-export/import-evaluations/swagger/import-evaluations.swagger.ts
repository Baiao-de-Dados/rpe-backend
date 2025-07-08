import { applyDecorators } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export function ApiImportEvaluations() {
    return applyDecorators(
        ApiTags('Importação'),
        ApiOperation({ summary: 'Importar avaliações a partir de um arquivo Excel' }),
        ApiConsumes('multipart/form-data'),
        ApiResponse({ status: 200, description: 'Avaliações importadas com sucesso.' }),
        ApiResponse({
            status: 400,
            description: 'Erro na validação do arquivo ou formato inválido.',
        }),
    );
}
