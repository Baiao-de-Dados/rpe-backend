import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class GetCollaboratorsScoresDto {
    @ApiProperty({
        example: 1,
        description: 'ID do ciclo de avaliação para filtrar os colaboradores',
        required: true,
    })
    @IsInt({ message: 'O parâmetro cycleId deve ser um número inteiro.' })
    @Min(1, { message: 'O parâmetro cycleId deve ser maior ou igual a 1.' })
    cycleId: number;

    @ApiProperty({
        example: 5,
        description: 'ID do colaborador para buscar os dados de avaliação',
        required: true,
    })
    @IsInt({ message: 'O parâmetro collaboratorId deve ser um número inteiro.' })
    @Min(1, { message: 'O parâmetro collaboratorId deve ser maior ou igual a 1.' })
    collaboratorId: number;
}
