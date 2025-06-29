import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltersDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    cycleId: number;
}
