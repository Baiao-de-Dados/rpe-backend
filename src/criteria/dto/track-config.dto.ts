import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackConfigCriterionDto {
    @ApiProperty({ description: 'ID do critério' })
    @IsString()
    id: string;

    @ApiProperty({ description: 'Peso do critério (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    weight: number;
}

export class TrackConfigPillarDto {
    @ApiProperty({ description: 'ID do pilar' })
    @IsString()
    id: string;

    @ApiProperty({ type: [TrackConfigCriterionDto], description: 'Critérios do pilar' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TrackConfigCriterionDto)
    criteria: TrackConfigCriterionDto[];
}

export class TrackConfigDto {
    @ApiProperty({ description: 'ID da trilha' })
    @IsString()
    id: string;

    @ApiProperty({ type: [TrackConfigPillarDto], description: 'Pilares da trilha' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TrackConfigPillarDto)
    pillars: TrackConfigPillarDto[];
}
