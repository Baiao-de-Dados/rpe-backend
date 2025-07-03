import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ExtendCycleDto {
    @ApiProperty({
        description: 'Nova data de fim do ciclo',
        example: '2025-07-15',
    })
    @IsNotEmpty()
    @IsDateString()
    endDate: string;
}
