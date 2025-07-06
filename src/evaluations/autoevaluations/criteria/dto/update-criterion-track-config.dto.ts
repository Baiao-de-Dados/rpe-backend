import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCriterionTrackConfigDto {
    @ApiProperty({ description: 'Se o critério está ativo para esta trilha', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Peso do critério para esta trilha', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;
}
