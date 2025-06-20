import {
    IsString,
    IsNumber,
    IsArray,
    IsOptional,
    ValidateNested,
    IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

class CriterioDto {
    @IsNumber()
    criterioId: number;

    @IsNumber()
    nota: number;

    @IsString()
    justificativa: string;
}

class PilarDto {
    @IsNumber()
    pilarId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CriterioDto)
    criterios: CriterioDto[];
}

class AutoAvaliacaoDto {
    @IsString()
    justificativa: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PilarDto)
    pilares: PilarDto[];
}

class Avaliacao360Dto {
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

class MentoringDto {
    @IsNumber()
    mentorId: number;

    @IsString()
    justificativa: string;
}

class ReferenciaDto {
    @IsNumber()
    colaboradorId: number;

    @IsArray()
    @IsNumber({}, { each: true })
    tagIds: number[];

    @IsString()
    justificativa: string;
}

export class CreateEvaluationDto {
    @IsString()
    ciclo: string;

    @IsNumber()
    colaboradorId: number;

    @IsDefined()
    @ValidateNested()
    @Type(() => AutoAvaliacaoDto)
    autoavaliacao: AutoAvaliacaoDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Avaliacao360Dto)
    avaliacao360: Avaliacao360Dto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MentoringDto)
    mentoring: MentoringDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReferenciaDto)
    referencias: ReferenciaDto[];
}
