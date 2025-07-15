import { IsNumber, ValidateNested, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export interface CollaboratorEvaluateDraft {
    cycleId: number;
    draft: {
        selfAssessment: {
            pillarId: number;
            criteriaId: number;
            rating: number;
            justification: string;
        }[];
        evaluation360: {
            evaluateeId: number;
            strengths: string;
            improvements: string;
            rating: number;
        }[];
        mentoring: {
            justification: string;
            rating: number;
        }[];
        references: {
            collaboratorId: number;
            justification: string;
        }[];
    };
}

export class SelfAssessmentItemDto {
    @IsNumber()
    pillarId: number;

    @IsNumber()
    criteriaId: number;

    @IsNumber()
    rating: number;

    @IsString()
    justification: string;
}

export class Evaluation360ItemDto {
    @IsNumber()
    evaluateeId: number;

    @IsString()
    strengths: string;

    @IsString()
    improvements: string;

    @IsNumber()
    rating: number;
}

export class MentoringItemDto {
    @IsString()
    justification: string;

    @IsNumber()
    rating: number;
}

export class ReferenceItemDto {
    @IsNumber()
    collaboratorId: number;

    @IsString()
    justification: string;
}

export class DraftDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SelfAssessmentItemDto)
    selfAssessment: SelfAssessmentItemDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Evaluation360ItemDto)
    evaluation360: Evaluation360ItemDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MentoringItemDto)
    mentoring: MentoringItemDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReferenceItemDto)
    references: ReferenceItemDto[];
}

export class EvaluationDraftDto {
    @IsNumber()
    cycleId: number;

    @ValidateNested()
    @Type(() => DraftDto)
    draft: DraftDto;
}
