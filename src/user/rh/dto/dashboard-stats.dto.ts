import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BreakdownDto {
    @ApiProperty({ description: 'Número de autoavaliações preenchidas' })
    @IsNumber()
    autoEvaluation: number;

    @ApiProperty({ description: 'Número de avaliações 360 preenchidas' })
    @IsNumber()
    evaluation360: number;

    @ApiProperty({ description: 'Número de mentorias preenchidas' })
    @IsNumber()
    mentoring: number;

    @ApiProperty({ description: 'Número de referências preenchidas' })
    @IsNumber()
    references: number;
}

export class CycleStatsDto {
    @ApiProperty({ description: 'Identificador do ciclo' })
    @IsString()
    cycle: string;

    @ApiProperty({ description: 'Total de avaliações no ciclo' })
    @IsNumber()
    totalEvaluations: number;

    @ApiProperty({ description: 'Número de avaliações completadas' })
    @IsNumber()
    completedEvaluations: number;

    @ApiProperty({ description: 'Número de avaliações pendentes' })
    @IsNumber()
    pendingEvaluations: number;

    @ApiProperty({ description: 'Porcentagem de preenchimento do ciclo (%)' })
    @IsNumber()
    completionPercentage: number;

    @ApiProperty({ description: 'Detalhamento por tipo de avaliação' })
    @ValidateNested()
    @Type(() => BreakdownDto)
    breakdown: BreakdownDto;

    @ApiProperty({ description: 'Data de fechamento do ciclo (YYYY-MM-DD)' })
    @IsString()
    cycleEndDate: string;
}

export class OverallStatsDto {
    @ApiProperty({ description: 'Total de avaliações em todos os ciclos' })
    @IsNumber()
    totalEvaluations: number;

    @ApiProperty({ description: 'Total de avaliações completadas' })
    @IsNumber()
    totalCompleted: number;

    @ApiProperty({ description: 'Total de avaliações pendentes' })
    @IsNumber()
    totalPending: number;

    @ApiProperty({ description: 'Porcentagem geral de preenchimento (%)' })
    @IsNumber()
    completionPercentage: number;
}

export class DashboardStatsDto {
    @ApiProperty({ description: 'Estatísticas gerais do ciclo atual' })
    @ValidateNested()
    @Type(() => OverallStatsDto)
    overall: OverallStatsDto;

    @ApiProperty({ description: 'Estatísticas detalhadas do ciclo atual' })
    @ValidateNested()
    @Type(() => CycleStatsDto)
    cycle: CycleStatsDto;

    @ApiProperty({ description: 'Ciclo atual sendo analisado' })
    @IsString()
    currentCycle: string;

    @ApiProperty({ description: 'Data/hora da última atualização dos dados' })
    @IsString()
    lastUpdated: string;
}
