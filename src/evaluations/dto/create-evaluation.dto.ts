import { Type } from 'class-transformer';
import {
    IsString,
    IsNumber,
    IsArray,
    IsOptional,
    ValidateNested,
    IsDefined,
    IsEnum,
} from 'class-validator';
import { EvaluationType } from '@prisma/client';

// DTO simples para autoavaliação
export class SimpleCreateEvaluationDto {
    @IsEnum(EvaluationType)
    type: EvaluationType;

    @IsNumber()
    evaluateeId: number;

    @IsNumber()
    cycle: number;

    @IsString()
    justification: string;

    @IsNumber()
    score: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CriteriaAssignmentDto)
    criteriaAssignments: CriteriaAssignmentDto[];
}

export class CriteriaAssignmentDto {
    @IsNumber()
    criterionId: number;

    @IsNumber()
    note: number;

    @IsString()
    justification: string;
}

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

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MentoringDto)
    mentoring: MentoringDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReferenciaDto)
    referencias: ReferenciaDto[];
}
