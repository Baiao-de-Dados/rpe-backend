import { IsInt, IsOptional } from 'class-validator';

export class AssignLeaderEvaluationDto {
    @IsInt()
    collaboratorId: number;

    @IsInt()
    cycleId: number;

    @IsInt()
    @IsOptional()
    leaderId?: number | null;
}
