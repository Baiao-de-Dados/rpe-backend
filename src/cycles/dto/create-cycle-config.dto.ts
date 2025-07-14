import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class PillarConfigDto {
    @ApiProperty({ example: 1, description: 'ID do pilar' })
    pillarId: number;

    @ApiProperty({ example: true, description: 'Se o pilar está ativo no ciclo' })
    isActive: boolean;

    @ApiProperty({ example: 1.0, description: 'Peso do pilar no ciclo' })
    weight: number;
}

export class CreateCycleConfigDto {
    @ApiProperty({ example: '2025-01-01T00:00:00Z', description: 'Data de início do ciclo' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2025-06-30T23:59:59Z', description: 'Data de fim do ciclo' })
    @IsDateString()
    endDate: string;
}
