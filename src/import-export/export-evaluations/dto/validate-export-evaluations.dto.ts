import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateExportEvaluationsDto {
    @ApiProperty({
        example: 1,
        description: 'ID do ciclo de avaliação',
    })
    @Type(() => Number)
    @IsNumber({}, { message: 'O parâmetro cycleId deve ser um número.' })
    @IsInt({ message: 'O parâmetro cycleId deve ser um número inteiro.' })
    @Min(1, { message: 'O parâmetro cycleId deve ser maior ou igual a 1.' })
    cycleId: number;
}
