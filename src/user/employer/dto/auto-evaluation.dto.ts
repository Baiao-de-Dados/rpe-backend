import {
    ArrayNotEmpty,
    ValidateNested,
    IsNumber,
    Min,
    Max,
    IsOptional,
    IsString,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class AutoEvaluationItem {
    @IsNumber()
    questionId: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    score: number;

    @IsOptional()
    @IsString()
    justification?: string;
}

export class AutoEvaluationDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => AutoEvaluationItem)
    responses: AutoEvaluationItem[];
}
