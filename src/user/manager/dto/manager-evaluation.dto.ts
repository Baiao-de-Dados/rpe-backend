import { IsNumber, ValidateNested, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';
import { AutoAvaliacaoDto } from '../../../evaluations/autoevaluations/dto/autoavaliacao.dto';

export class ManagerEvaluationDto {
    @IsNumber()
    cycleConfigId: number;

    @IsNumber()
    managerId: number;

    @IsNumber()
    colaboradorId: number;

    @IsDefined()
    @ValidateNested()
    @Type(() => AutoAvaliacaoDto)
    autoavaliacao: AutoAvaliacaoDto;
}
