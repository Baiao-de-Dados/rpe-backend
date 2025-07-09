import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';

export class GetCollaboratorsScoresDto {
    @ApiProperty({
        example: 1,
        description: 'ID do ciclo de avaliação para filtrar os colaboradores',
        required: false,
    })
    @IsOptional()
    @IsInt({ message: 'O parâmetro cycleId deve ser um número inteiro.' })
    @Min(1, { message: 'O parâmetro cycleId deve ser maior ou igual a 1.' })
    cycleId?: number;
}
