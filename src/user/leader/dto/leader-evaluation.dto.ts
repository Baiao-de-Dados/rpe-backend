import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class LeaderEvaluationDto {
    @IsInt()
    cycleId: number;

    @IsInt()
    @Min(1)
    @Max(5)
    generalRating: number;

    @IsString()
    generalJustification: string;

    @IsString()
    @IsOptional()
    strengths?: string;

    @IsString()
    @IsOptional()
    improvements?: string;

    @IsInt()
    collaboratorId: number;

    @IsInt()
    leaderId: number;
}
