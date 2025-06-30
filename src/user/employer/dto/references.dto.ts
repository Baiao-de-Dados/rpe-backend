import {
    IsOptional,
    IsString,
    IsNumber,
    IsArray,
    ArrayNotEmpty,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReferenceItem {
    @IsNumber()
    employerId: number;

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
