import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ApiStandardResponses } from './api-standard-responses.decorator';

/**
 * Decorators para endpoints de importação/exportação de arquivos (ex: ERP, CSV, Excel)
 * @ApiImport('entidade')
 * @ApiExport('entidade')
 */

export function ApiImport(entity: string, fileType = 'multipart/form-data') {
    return applyDecorators(
        ApiOperation({ summary: `Importação de arquivo para ${entity}` }),
        ApiConsumes(fileType),
        ApiBody({
            description: 'Arquivo para importação',
            type: 'file',
        }),
        ApiResponse({ status: 201, description: `Arquivo importado para ${entity} com sucesso` }),
        ApiStandardResponses(),
    );
}

export function ApiExport(entity: string) {
    return applyDecorators(
        ApiOperation({ summary: `Exportação de arquivo de ${entity}` }),
        ApiResponse({ status: 200, description: `Arquivo exportado de ${entity} com sucesso` }),
        ApiStandardResponses(),
    );
}
