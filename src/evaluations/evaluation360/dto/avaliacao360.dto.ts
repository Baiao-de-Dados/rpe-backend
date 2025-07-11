import { IsNumber, IsString, IsOptional } from 'class-validator';

export class Avaliacao360Dto {
    @IsNumber()
    avaliadoId: number;

    @IsString()
    @IsOptional()
    pontosFortes?: string;

    @IsString()
    @IsOptional()
    pontosMelhoria?: string;

    @IsString()
    justificativa: string;
}
