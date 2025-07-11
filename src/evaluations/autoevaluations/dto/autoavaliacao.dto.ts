import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PilarDto } from './pilar.dto';

export class AutoAvaliacaoDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PilarDto)
    pilares: PilarDto[];
}
