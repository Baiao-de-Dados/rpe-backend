import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export function ApiSaveEqualization() {
    return applyDecorators(
        ApiTags('Equalização'),
        ApiOperation({
            summary: 'Salvar a equalização de um colaborador',
            description: 'Salva a nota final e a justificativa de um colaborador em um ciclo específico.',
        }),
        ApiResponse({
            status: 201,
            description: 'Equalização salva com sucesso.',
        }),
        ApiResponse({
            status: 404,
            description: 'Ciclo, colaborador ou avaliação não encontrados.',
        }),
        ApiResponse({
            status: 400,
            description: 'Erro de validação nos parâmetros enviados.',
        }),
    );
}

export function ApiEditEqualization() {
    return applyDecorators(
        ApiTags('Equalização'),
        ApiOperation({
            summary: 'Editar a equalização de um colaborador',
            description: 'Edita a nota final e a justificativa de um colaborador em um ciclo específico.',
        }),
        ApiResponse({
            status: 200,
            description: 'Equalização editada com sucesso.',
        }),
        ApiResponse({
            status: 404,
            description: 'Ciclo, colaborador ou equalização não encontrados.',
        }),
        ApiResponse({
            status: 400,
            description: 'Erro de validação nos parâmetros enviados.',
        }),
    );
}
