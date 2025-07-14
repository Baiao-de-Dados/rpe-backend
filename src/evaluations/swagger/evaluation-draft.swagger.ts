import { ApiProperty } from '@nestjs/swagger';

export class SelfSelfAssessmentItemDto {
    @ApiProperty({ example: 1 })
    pillarId: number;
    @ApiProperty({ example: 1 })
    criteriaId: number;
    @ApiProperty({ example: 4 })
    rating: number;
    @ApiProperty({ example: 'Ótimo desempenho neste critério.' })
    justification: string;
}

export class EvaluationDraftRequestDto {
    @ApiProperty({ example: 1 })
    cycleId: number;
    @ApiProperty({ type: [SelfSelfAssessmentItemDto] })
    draft: SelfSelfAssessmentItemDto[];
}

export class EvaluationDraftResponseDto {
    @ApiProperty({ example: 1 })
    id: number;
    @ApiProperty({ example: 1 })
    userId: number;
    @ApiProperty({ example: 1 })
    cycleId: number;
    @ApiProperty({ type: [SelfSelfAssessmentItemDto] })
    draft: SelfSelfAssessmentItemDto[];
    @ApiProperty({ example: '2025-07-14T18:57:20.000Z' })
    createdAt: string;
    @ApiProperty({ example: '2025-07-14T18:57:20.000Z' })
    updatedAt: string;
}

export const evaluationDraftRequestExample = {
    summary: 'Exemplo de envio de rascunho de avaliação',
    value: {
        cycleId: 1,
        draft: [
            {
                pillarId: 1,
                criteriaId: 1,
                rating: 4,
                justification: 'Ótimo desempenho neste critério.',
            },
            {
                pillarId: 2,
                criteriaId: 2,
                rating: 3,
                justification: 'Precisa melhorar comunicação.',
            },
        ],
    },
};

export const evaluationDraftResponseExample = {
    summary: 'Exemplo de resposta de draft de avaliação',
    value: {
        id: 1,
        userId: 1,
        cycleId: 1,
        draft: [
            {
                pillarId: 1,
                criteriaId: 1,
                rating: 4,
                justification: 'Ótimo desempenho neste critério.',
            },
            {
                pillarId: 2,
                criteriaId: 2,
                rating: 3,
                justification: 'Precisa melhorar comunicação.',
            },
        ],
        createdAt: '2025-07-14T18:57:20.000Z',
        updatedAt: '2025-07-14T18:57:20.000Z',
    },
};

// --- Avaliação completa ---

export class EvaluationPillarCriteriaDto {
    @ApiProperty({ example: 1 })
    criterioId: number;
    @ApiProperty({ example: 5 })
    nota: number;
    @ApiProperty({ example: 'Ótima participação.' })
    justificativa: string;
}

export class EvaluationPillarDto {
    @ApiProperty({ example: 1 })
    pilarId: number;
    @ApiProperty({ type: [EvaluationPillarCriteriaDto] })
    criterios: EvaluationPillarCriteriaDto[];
}

export class Evaluation360Dto {
    @ApiProperty({ example: 2 })
    avaliadoId: number;
    @ApiProperty({ example: 'Ótimo trabalho em equipe' })
    pontosFortes: string;
    @ApiProperty({ example: 'Precisa melhorar organização' })
    pontosMelhoria: string;
    @ApiProperty({ example: 'Justifique sua nota' })
    justificativa: string;
}

export class MentoringDto {
    @ApiProperty({ example: 3 })
    mentorId: number;
    @ApiProperty({ example: 'Justifique sua avaliação do mentor' })
    justificativa: string;
    @ApiProperty({ example: 4, required: false })
    leaderId?: number;
    @ApiProperty({ example: 'Justifique sua avaliação do líder', required: false })
    leaderJustificativa?: string;
}

export class ReferenceDto {
    @ApiProperty({ example: 5 })
    colaboradorId: number;
    @ApiProperty({ example: [1, 2, 5] })
    tagIds: number[];
    @ApiProperty({ example: 'Justifique sua escolha' })
    justificativa: string;
}

export class EvaluationRequestDto {
    @ApiProperty({ example: '2025.1' })
    ciclo: string;
    @ApiProperty({ example: 1 })
    colaboradorId: number;
    @ApiProperty({ type: [EvaluationPillarDto] })
    autoavaliacao: EvaluationPillarDto[];
    @ApiProperty({ type: [Evaluation360Dto] })
    avaliacao360: Evaluation360Dto[];
    @ApiProperty({ type: [MentoringDto] })
    mentoring: MentoringDto[];
    @ApiProperty({ type: [ReferenceDto] })
    referencias: ReferenceDto[];
}

export const evaluationRequestExample = {
    summary: 'Exemplo de envio de avaliação completa',
    value: {
        ciclo: '2025.1',
        colaboradorId: 1,
        autoavaliacao: [
            {
                pilarId: 10,
                criterios: [
                    {
                        criterioId: 1,
                        nota: 3,
                        justificativa: 'Justifique sua nota',
                    },
                    {
                        criterioId: 2,
                        nota: 4,
                        justificativa: 'Me mostrei resiliente em situações complicadas',
                    },
                ],
            },
        ],
        avaliacao360: [
            {
                avaliadoId: 2,
                pontosFortes: 'Ótimo trabalho em equipe',
                pontosMelhoria: 'Precisa melhorar organização',
                justificativa: 'Justifique sua nota',
            },
        ],
        mentoring: [
            {
                mentorId: 3,
                justificativa: 'Justifique sua avaliação do mentor',
                leaderId: 4,
                leaderJustificativa: 'Justifique sua avaliação do líder',
            },
        ],
        referencias: [
            {
                colaboradorId: 5,
                tagIds: [1, 2, 5],
                justificativa: 'Justifique sua escolha',
            },
        ],
    },
};

export const evaluationResponseExample = {
    summary: 'Exemplo de resposta de avaliação criada',
    value: {
        id: 123,
        ciclo: '2025.1',
        colaboradorId: 1,
        autoavaliacao: [
            {
                pilarId: 10,
                criterios: [
                    {
                        criterioId: 1,
                        nota: 3,
                        justificativa: 'Justifique sua nota',
                    },
                    {
                        criterioId: 2,
                        nota: 4,
                        justificativa: 'Me mostrei resiliente em situações complicadas',
                    },
                ],
            },
        ],
        avaliacao360: [
            {
                avaliadoId: 2,
                pontosFortes: 'Ótimo trabalho em equipe',
                pontosMelhoria: 'Precisa melhorar organização',
                justificativa: 'Justifique sua nota',
            },
        ],
        mentoring: [
            {
                mentorId: 3,
                justificativa: 'Justifique sua avaliação do mentor',
                leaderId: 4,
                leaderJustificativa: 'Justifique sua avaliação do líder',
            },
        ],
        referencias: [
            {
                colaboradorId: 5,
                tagIds: [1, 2, 5],
                justificativa: 'Justifique sua escolha',
            },
        ],
    },
};
