import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class SetCurrentCycleDto {
    @ApiProperty()
    @IsNumber()
    @IsPositive()
    CycleConfigId: number;
}
