import { ApiProperty } from '@nestjs/swagger';

export class PillarConfigResponseDto {
    @ApiProperty({ example: 1, description: 'ID da configuração' })
    id: number;

    @ApiProperty({ example: 1, description: 'ID do pilar' })
    pillarId: number;

    @ApiProperty({ example: 'Técnico', description: 'Nome do pilar' })
    pillarName: string;

    @ApiProperty({ example: true, description: 'Se o pilar está ativo no ciclo' })
    isActive: boolean;

    @ApiProperty({ example: 1.0, description: 'Peso do pilar no ciclo' })
    weight: number;
}

export class CycleConfigResponseDto {
    @ApiProperty({ example: 1, description: 'ID da configuração' })
    id: number;

    @ApiProperty({ example: '2025.1', description: 'Nome do ciclo' })
    name: string;

    @ApiProperty({ example: 'Ciclo de avaliação 2025.1', description: 'Descrição do ciclo' })
    description?: string;

    @ApiProperty({ example: '2025-01-01T00:00:00Z', description: 'Data de início do ciclo' })
    startDate: string;

    @ApiProperty({ example: '2025-06-30T23:59:59Z', description: 'Data de fim do ciclo' })
    endDate: string;

    @ApiProperty({ example: true, description: 'Se o ciclo está ativo' })
    isActive: boolean;

    @ApiProperty({ example: '2025-01-01T00:00:00Z', description: 'Data de criação' })
    createdAt: string;

    @ApiProperty({ example: '2025-01-01T00:00:00Z', description: 'Data de atualização' })
    updatedAt: string;

    @ApiProperty({ type: [PillarConfigResponseDto], description: 'Pilares do ciclo' })
    criteriaPillars: any[];
}
