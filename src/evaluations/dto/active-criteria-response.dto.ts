import { ApiProperty } from '@nestjs/swagger';

export class ActiveCriteriaPillarDto {
    @ApiProperty({ example: 1, description: 'ID do pilar' })
    id: number;

    @ApiProperty({ example: 'Técnico', description: 'Nome do pilar' })
    name: string;
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
    weight: number | null;

    @ApiProperty({ type: ActiveCriteriaPillarDto, description: 'Pilar do critério' })
    pillar: ActiveCriteriaPillarDto;
}

export class CriterioDto {
    @ApiProperty({ description: 'ID do critério' })
    id: number;

    @ApiProperty({ description: 'Nome do critério' })
    name: string;

    @ApiProperty({ description: 'Descrição do critério' })
    description: string;

    @ApiProperty({ description: 'Peso personalizado para a trilha' })
    weight: number | null;

    @ApiProperty({ description: 'Peso original do critério (sempre null agora)', required: false })
    originalWeight?: number | null;
}

export class PilarDto {
    @ApiProperty({ description: 'ID do pilar' })
    id: number;

    @ApiProperty({ description: 'Nome do pilar' })
    name: string;

    @ApiProperty({ description: 'Critérios do pilar', type: [CriterioDto] })
    criterios: CriterioDto[];
}

export class UserInfoDto {
    @ApiProperty({ description: 'ID do usuário' })
    id: number;

    @ApiProperty({ description: 'Trilha do usuário' })
    track: string;
}

export class ActiveCriteriaResponseDto {
    @ApiProperty({ description: 'Critérios ativos', type: [CriterioDto] })
    criteria: CriterioDto[];
}

export class ActiveCriteriaUserResponseDto {
    @ApiProperty({ description: 'Informações do usuário' })
    user: {
        id: number;
        track: string;
    };

    @ApiProperty({ description: 'Informações do ciclo ativo' })
    cycle: {
        id: number;
        name: string;
        startDate: Date;
        endDate: Date;
    };

    @ApiProperty({ description: 'Pilares com critérios ativos', type: [ActiveCriteriaPillarDto] })
    pilares: ActiveCriteriaPillarDto[];
}
