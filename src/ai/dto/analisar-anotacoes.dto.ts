import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalisarAnotacoesDto {
    @ApiProperty({ example: 1, description: 'ID do usuário a ser analisado' })
    @IsNumber()
    userId: number;

    @ApiProperty({ example: 20251, description: 'ID do ciclo de avaliação' })
    @IsNumber()
    cycleId: number;
}
