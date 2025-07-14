import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class Avaliacao360Dto {
    @IsNumber()
    @IsNotEmpty()
    avaliadoId: number;

    @IsString()
    @IsNotEmpty()
    pontosFortes: string;

    @IsString()
    @IsNotEmpty()
    pontosMelhoria: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    score: number;
}
