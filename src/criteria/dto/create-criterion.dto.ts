import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCriterionDto {
    @ApiProperty({
        example: 'Conhecimento Técnico',
        description: 'Nome do critério',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'Domínio das tecnologias utilizadas no projeto',
        description: 'Descrição do critério',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        example: 1,
        description: 'ID do pilar ao qual o critério pertence',
    })
    @IsNumber()
    pillarId: number;
}

export class CriterionResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Sentimento de Dono' })
    name: string;

    @ApiProperty({
        example: 'Demonstra responsabilidade e senso de pertencimento nas tarefas e resultados.',
        required: false,
        nullable: true,
    })
    description?: string | null;

    @ApiProperty({ example: 1 })
    pillarId: number;
}
