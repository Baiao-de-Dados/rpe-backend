import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCycleConfigDto {
    @ApiPropertyOptional({ example: '2025.1', description: 'Nome do ciclo' })
    name?: string;

    @ApiPropertyOptional({
        example: 'Ciclo de avaliação 2025.1',
        description: 'Descrição do ciclo',
    })
    description?: string;

    @ApiPropertyOptional({
        example: '2025-01-01T00:00:00Z',
        description: 'Data de início do ciclo',
    })
    startDate?: Date;

    @ApiPropertyOptional({ example: '2025-06-30T23:59:59Z', description: 'Data de fim do ciclo' })
    endDate?: Date;

    @ApiPropertyOptional({ example: false, description: 'Se o ciclo foi finalizado' })
    done?: boolean;
}
