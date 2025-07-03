import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsDateString,
    IsOptional,
    IsBoolean,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PillarConfigDto {
    @ApiProperty({ example: 1, description: 'ID do pilar' })
    pillarId: number;

    @ApiProperty({ example: true, description: 'Se o pilar está ativo no ciclo' })
    isActive: boolean;

    @ApiProperty({ example: 1.0, description: 'Peso do pilar no ciclo' })
    weight: number;
}

export class CreateCycleConfigDto {
    @ApiProperty({ example: '2025.1', description: 'Nome do ciclo' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Ciclo de avaliação 2025.1', description: 'Descrição do ciclo' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: '2025-01-01T00:00:00Z', description: 'Data de início do ciclo' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2025-06-30T23:59:59Z', description: 'Data de fim do ciclo' })
    @IsDateString()
    endDate: string;

    @ApiProperty({ example: true, description: 'Se o ciclo está ativo' })
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({ type: [PillarConfigDto], description: 'Configurações dos pilares' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PillarConfigDto)
    pillarConfigs: PillarConfigDto[];
}
