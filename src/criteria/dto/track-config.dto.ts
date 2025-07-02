import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackConfigCriterionDto {
    @ApiProperty({ description: 'ID do critério', example: 4 })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'Peso do critério (0-100)', example: 10 })
    @IsNumber()
    @Min(0)
    @Max(100)
    weight: number;
}

export class TrackConfigPillarDto {
    @ApiProperty({ description: 'ID do pilar', example: 1 })
    @IsNumber()
    id: number;

    @ApiProperty({
        type: [TrackConfigCriterionDto],
        description: 'Critérios do pilar',
        example: [
            { id: 4, weight: 10 },
            { id: 5, weight: 20 },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TrackConfigCriterionDto)
    criteria: TrackConfigCriterionDto[];
}

export class TrackConfigDto {
    @ApiProperty({ description: 'Nome da trilha', example: 'design' })
    @IsString()
    track: string;

    @ApiProperty({
        type: [TrackConfigPillarDto],
        description: 'Pilares da trilha',
        example: [
            {
                id: 1,
                criteria: [
                    { id: 4, weight: 10 },
                    { id: 5, weight: 20 },
                ],
            },
            {
                id: 2,
                criteria: [{ id: 6, weight: 30 }],
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TrackConfigPillarDto)
    pillars: TrackConfigPillarDto[];
}
