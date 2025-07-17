import { IsNumber, IsString, Min, Max, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class EqualizationDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    score: number;

    @IsString()
    justification: string;

    @IsString()
    @IsOptional()
    changeReason?: string;

    @IsString()
    @IsOptional()
    aiSummary?: string;
}

export class SaveEqualizationDto {
    @IsNumber()
    cycleConfigId: number;

    @IsNumber()
    collaboratorId: number;

    @ValidateNested()
    @Type(() => EqualizationDto)
    equalization: EqualizationDto;
}
