import { ApiProperty } from '@nestjs/swagger';

export class ActiveCriteriaPillarDto {
    @ApiProperty({ example: 1, description: 'ID do pilar' })
    id: number;

    @ApiProperty({ example: 'Técnico', description: 'Nome do pilar' })
    name: string;

    @ApiProperty({ example: 'Pilar técnico', description: 'Descrição do pilar' })
    description?: string;
}

export class ActiveCriteriaDto {
    @ApiProperty({ example: 1, description: 'ID do critério' })
    id: number;

    @ApiProperty({ example: 'Qualidade do Código', description: 'Nome do critério' })
    name: string;

    @ApiProperty({
        example: 'Avalia a qualidade do código produzido',
        description: 'Descrição do critério',
    })
    description?: string;

    @ApiProperty({ example: 1.0, description: 'Peso do critério no ciclo atual' })
    weight: number;

    @ApiProperty({ type: ActiveCriteriaPillarDto, description: 'Pilar do critério' })
    pillar: ActiveCriteriaPillarDto;
}

export class ActiveCriteriaResponseDto {
    @ApiProperty({ type: [ActiveCriteriaDto], description: 'Lista de critérios ativos' })
    criteria: ActiveCriteriaDto[];
}
