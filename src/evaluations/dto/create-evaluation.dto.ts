import { Type } from 'class-transformer';
import {
    IsString,
    IsNumber,
    IsArray,
    IsOptional,
    ValidateNested,
    IsDefined,
} from 'class-validator';

class CriterioDto {
    @IsString()
    criterioId: string;

    @IsNumber()
    nota: number;

    @IsString()
    justificativa: string;
}

class PilarDto {
    @IsString()
    pilarId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CriterioDto)
    criterios: CriterioDto[];
}

class AutoAvaliacaoDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PilarDto)
    pilares: PilarDto[];
}

class Avaliacao360Dto {
    @IsString()
    avaliadoId: string;

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
    @IsString()
    mentorId: string;

    @IsString()
    justificativa: string;

    @IsOptional()
    @IsString()
    leaderId?: string;

    @IsOptional()
    @IsString()
    leaderJustificativa?: string;
}

class ReferenciaDto {
    @IsString()
    colaboradorId: string;

    @IsArray()
    @IsNumber({}, { each: true })
    tagIds: number[];

    @IsString()
    justificativa: string;
}

export class CreateEvaluationDto {
    @IsString()
    ciclo: string;

    @IsString()
    colaboradorId: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => AutoAvaliacaoDto)
    autoavaliacao: AutoAvaliacaoDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Avaliacao360Dto)
    avaliacao360: Avaliacao360Dto[];

    @IsDefined()
    @ValidateNested()
    @Type(() => MentoringDto)
    mentoring: MentoringDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReferenciaDto)
    referencias: ReferenciaDto[];
}
