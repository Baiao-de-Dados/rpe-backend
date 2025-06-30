import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class MentoringDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    score: number;

    @IsOptional()
    @IsString()
    justification?: string;
}
