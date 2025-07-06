import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class Evaluation360Item {
    @IsNumber()
    evaluateeId: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    score: number;

    @IsString()
    justification: string;

    @IsOptional()
    @IsString()
    strenghts?: string;

    @IsOptional()
    @IsString()
    improvements?: string;
}

export class Evaluation360Dto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Evaluation360Item)
    responses: Evaluation360Item[];
}
