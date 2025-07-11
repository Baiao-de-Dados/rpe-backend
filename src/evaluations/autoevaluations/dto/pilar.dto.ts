import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CriterioDto } from './criterio.dto';

export class PilarDto {
    @IsNumber()
    pilarId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CriterioDto)
    criterios: CriterioDto[];
}
