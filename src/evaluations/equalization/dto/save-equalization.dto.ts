import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsString, IsNotEmpty } from 'class-validator';

export class SaveEqualizationDto {
    @ApiProperty({
        example: 1,
        description: 'ID do ciclo de avaliação',
    })
    @IsNumber({}, { message: 'O parâmetro cycleId deve ser um número.' })
    @Min(1, { message: 'O parâmetro cycleId deve ser maior ou igual a 1.' })
    cycleId: number;

    @ApiProperty({
        example: 5,
        description: 'ID do colaborador',
    })
    @IsNumber({}, { message: 'O parâmetro collaboratorId deve ser um número.' })
    @Min(1, { message: 'O parâmetro collaboratorId deve ser maior ou igual a 1.' })
    collaboratorId: number;

    @ApiProperty({
        example: 4.5,
        description: 'Nota final do colaborador no ciclo',
    })
    @IsNumber({}, { message: 'O parâmetro rating deve ser um número.' })
    rating: number;

    @ApiProperty({
        example: 'Excelente desempenho no ciclo.',
        description: 'Justificativa para a nota final',
    })
    @IsString({ message: 'O parâmetro justification deve ser uma string.' })
    @IsNotEmpty({ message: 'O parâmetro justification não pode estar vazio.' })
    justification: string;
}
