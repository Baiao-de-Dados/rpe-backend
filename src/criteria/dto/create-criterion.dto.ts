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
        example: 0.4,
        description: 'Peso do critério (0.0 a 1.0)',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    weight?: number;

    @ApiProperty({
        example: 1,
        description: 'ID do pilar ao qual o critério pertence',
    })
    @IsNumber()
    pillarId: number;
}
