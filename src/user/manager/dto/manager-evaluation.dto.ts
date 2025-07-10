import { IsInt, IsString, IsArray, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ManagerEvaluationCriteriaDto {
    @IsInt()
    criteriaId: number;

    @IsInt()
    @Min(1)
    @Max(5)
    score: number;

    @IsString()
    justification: string;
}

export class ManagerEvaluationDto {
    @IsInt()
    cycleId: number;

    @IsInt()
    managerId: number;

    @IsInt()
    collaboratorId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ManagerEvaluationCriteriaDto)
    criterias: ManagerEvaluationCriteriaDto[];
}
