import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ValidateExportEvaluationsDto {
    @ApiProperty({
        example: 1,
        description: 'ID do ciclo de avaliação para exportar os dados',
    })
    @IsInt({ message: 'O parâmetro cycleId deve ser um número inteiro.' })
    @Min(1, { message: 'O parâmetro cycleId deve ser maior ou igual a 1.' })
    cycleId: number;
}
