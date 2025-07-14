import { IsNumber, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class SelfSelfAssessmentItemDto {
    @IsNumber()
    pillarId: number;

    @IsNumber()
    criteriaId: number;

    @IsNumber()
    rating: number;

    justification: string;
}

export class EvaluationDraftDto {
    @IsNumber()
    cycleId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SelfSelfAssessmentItemDto)
    draft: SelfSelfAssessmentItemDto[];
}
