import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ReferenciaDto {
    @IsNumber()
    colaboradorId: number;

    @IsOptional()
    @IsString()
    justificativa: string;
}
