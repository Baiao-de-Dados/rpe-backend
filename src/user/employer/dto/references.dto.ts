import {
    IsOptional,
    IsString,
    IsArray,
    ArrayNotEmpty,
    ValidateNested,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReferenceItem {
    @IsNumber()
    evaluateeId: number;

    @IsOptional()
    @IsString()
    justification: string;
}

export class ReferenceDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => ReferenceItem)
    references: ReferenceItem[];
}
