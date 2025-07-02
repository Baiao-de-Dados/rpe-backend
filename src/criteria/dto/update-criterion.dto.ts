import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateCriterionDto {
    @ApiProperty({
        example: 'Conhecimento Técnico Atualizado',
        description: 'Nome do critério',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        example: 'Domínio atualizado das tecnologias utilizadas no projeto',
        description: 'Descrição do critério',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;
}
