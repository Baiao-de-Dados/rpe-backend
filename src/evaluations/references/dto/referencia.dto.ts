import { IsString, IsNumber } from 'class-validator';

export class ReferenciaDto {
    @IsNumber()
    colaboradorId: number;

    @IsString()
    justificativa: string;
}
