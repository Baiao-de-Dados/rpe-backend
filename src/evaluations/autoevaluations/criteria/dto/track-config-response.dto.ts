import { ApiProperty } from '@nestjs/swagger';

export class CriterionResponseDto {
    @ApiProperty({ description: 'ID do critério' })
    id: number;

    @ApiProperty({ description: 'Nome do critério' })
    name: string;

    @ApiProperty({ description: 'Descrição do critério', required: false })
    description?: string;

    @ApiProperty({ description: 'Peso do critério na trilha' })
    weight: number;
}

export class PillarResponseDto {
    @ApiProperty({ description: 'ID do pilar' })
    id: number;

    @ApiProperty({ description: 'Nome do pilar' })
    name: string;

    @ApiProperty({ description: 'Critérios do pilar', type: [CriterionResponseDto] })
    criteria: CriterionResponseDto[];
}

export class TrackConfigResponseDto {
    @ApiProperty({ description: 'Nome da trilha' })
    name: string;

    @ApiProperty({ description: 'Pilares da trilha', type: [PillarResponseDto] })
    pillars: PillarResponseDto[];
}
