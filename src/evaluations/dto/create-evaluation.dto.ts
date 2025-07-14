import { IsNumber, IsArray, ValidateNested, IsDefined } from 'class-validator';
import { AutoAvaliacaoDto } from '../autoevaluations/dto/autoavaliacao.dto';
import { Avaliacao360Dto } from '../evaluation360/dto/avaliacao360.dto';
import { MentoringDto } from '../mentoring/dto/mentoring.dto';
import { ReferenciaDto } from '../references/dto/referencia.dto';
import { Type } from 'class-transformer';

export class CreateEvaluationDto {
    @IsNumber()
    cycleConfigId: number;

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

    @IsDefined()
    @ValidateNested()
    @Type(() => MentoringDto)
    mentoring: MentoringDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReferenciaDto)
    referencias?: ReferenciaDto[];
}
