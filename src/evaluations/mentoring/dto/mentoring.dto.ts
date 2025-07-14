import { IsNumber, IsString, IsOptional } from 'class-validator';

export class MentoringDto {
    @IsNumber()
    mentorId: number;

    @IsString()
    justificativa: string;

    @IsOptional()
    @IsNumber()
    leaderId?: number;

    @IsOptional()
    @IsString()
    leaderJustificativa?: string;
}
