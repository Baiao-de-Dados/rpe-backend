import { ApiProperty } from '@nestjs/swagger';

export class GeminiSelfAssessmentItemDto {
    @ApiProperty({ example: '12' })
    pillarId: number;

    @ApiProperty({ example: 'gente' })
    criteriaId: number;

    @ApiProperty({ example: 4 })
    rating: number;

    @ApiProperty({
        example:
            'Tenho conseguido apoiar e guiar os colegas nas atividades do time, principalmente em momentos mais desafiadores.',
    })
    justification: string;
}

export class GeminiEvaluation360ItemDto {
    @ApiProperty({ example: 'colab-001' })
    collaboratorId: number;

    @ApiProperty({ example: 4 })
    rating: number;

    @ApiProperty({
        example: 'Ele tem um olhar criativo que contribui muito no início dos projetos',
    })
    strengths: string;

    @ApiProperty({ example: 'Às vezes poderia ser mais ágil nas entregas' })
    improvements: string;
}

export class GeminiMentoringDto {
    @ApiProperty({ example: 5 })
    rating: number;

    @ApiProperty({
        example:
            'Miguel sempre me ajuda a enxergar o cenário com mais clareza quando estou diante de uma decisão difícil.',
    })
    justification: string;
}

export class GeminiReferenceDto {
    @ApiProperty({ example: 'colab-001' })
    collaboratorId: number;

    @ApiProperty({
        example:
            'Ele tem um perfil técnico muito forte e sempre traz soluções práticas e bem embasadas.',
    })
    justification: string;
}

export class GeminiNotesEvaluationResponseDto {
    @ApiProperty({
        example: 'SUCCESS',
        enum: ['SUCCESS', 'NO_INSIGHT', 'ERROR', 'NO_IDENTIFICATION'],
    })
    code: 'SUCCESS' | 'NO_INSIGHT' | 'ERROR' | 'NO_IDENTIFICATION';

    @ApiProperty({ type: [GeminiSelfAssessmentItemDto], required: false })
    selfAssessment?: GeminiSelfAssessmentItemDto[];

    @ApiProperty({ type: [GeminiEvaluation360ItemDto], required: false })
    evaluation360?: GeminiEvaluation360ItemDto[];

    @ApiProperty({ type: () => GeminiMentoringDto, required: false, nullable: true })
    mentoring?: GeminiMentoringDto | null;

    @ApiProperty({ type: [GeminiReferenceDto], required: false })
    references?: GeminiReferenceDto[];

    @ApiProperty({ example: 'Mensagem de erro detalhada', required: false })
    error?: string;

    @ApiProperty({ example: 'Motivo da não identificação', required: false })
    noIdentificationReason?: string;

    @ApiProperty({
        example: 'João',
        required: false,
        description: 'Nome citado nas anotações que gerou dúvida de identificação',
    })
    written?: string;

    @ApiProperty({
        example: ['João Silva', 'João Souza'],
        required: false,
        type: [String],
        description: 'Lista de nomes dos colaboradores que podem ser o citado',
    })
    applicable?: string[];
}
