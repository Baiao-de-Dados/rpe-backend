import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePillarDto {
    @ApiProperty({
        example: 'Competências Técnicas',
        description: 'Nome do pilar',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'Avaliação de competências técnicas e conhecimentos específicos',
        description: 'Descrição detalhada do pilar',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;
}
