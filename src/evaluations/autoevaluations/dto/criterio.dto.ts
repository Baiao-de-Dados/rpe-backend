import { IsNumber, IsString } from 'class-validator';

export class CriterioDto {
    @IsNumber()
    criterioId: number;

    @IsNumber()
    nota: number;

    @IsString()
    justificativa: string;
}
