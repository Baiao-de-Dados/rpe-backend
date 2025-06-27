import { ApiQuery } from '@nestjs/swagger';

export function ApiQueryCycle() {
    return ApiQuery({
        name: 'cycle',
        required: false,
        description:
            'Ciclo específico para análise (ex: 2024-01). Se não fornecido, usa o ciclo mais recente.',
        type: String,
    });
}
