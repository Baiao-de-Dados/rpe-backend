import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class ImportEvaluationDto {
    @ApiProperty({
        example: 'João Silva',
        description: 'Nome do usuário avaliado',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'joao.silva@rocketcorp.com',
        description: 'Email do usuário avaliado',
    })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'AUTOEVALUATION',
        description: 'Tipo de avaliação (AUTOEVALUATION, PEER_360, MENTOR)',
    })
    @IsString()
    @IsNotEmpty()
    evaluationType: string;

    @ApiProperty({
        example: 'Sentimento de Dono',
        description: 'Nome do critério avaliado',
    })
    @IsString()
    @IsNotEmpty()
    criterion: string;

    @ApiProperty({
        example: 4.5,
        description: 'Nota atribuída na avaliação',
    })
    @IsNumber()
    @IsOptional()
    note?: number;

    @ApiProperty({
        example: 'Excelente trabalho em equipe.',
        description: 'Justificativa da avaliação',
    })
    @IsString()
    @IsNotEmpty()
    justification: string;
}
