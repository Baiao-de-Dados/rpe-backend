import { ApiProperty } from '@nestjs/swagger';

export class SelfAssessmentItemDto {
    @ApiProperty({ example: 1 })
    pillarId: number;
    @ApiProperty({ example: 1 })
    criteriaId: number;
    @ApiProperty({ example: 4 })
    rating: number;
    @ApiProperty({ example: 'Ótimo desempenho neste critério.' })
    justification: string;
}

export class Evaluation360ItemDto {
    @ApiProperty({ example: 2 })
    evaluateeId: number;
    @ApiProperty({ example: 'Ótimo trabalho em equipe' })
    strengths: string;
    @ApiProperty({ example: 'Precisa melhorar organização' })
    improvements: string;
    @ApiProperty({ example: 4 })
    rating: number;
}

export class MentoringItemDto {
    @ApiProperty({ example: 'Justifique sua avaliação do mentor' })
    justification: string;
    @ApiProperty({ example: 4 })
    rating: number;
}

export class ReferenceItemDto {
    @ApiProperty({ example: 5 })
    collaboratorId: number;
    @ApiProperty({ example: 'Justifique sua escolha' })
    justification: string;
}

export class DraftDto {
    @ApiProperty({ type: [SelfAssessmentItemDto] })
    selfAssessment: SelfAssessmentItemDto[];
    @ApiProperty({ type: [Evaluation360ItemDto] })
    evaluation360: Evaluation360ItemDto[];
    @ApiProperty({ type: [MentoringItemDto] })
    mentoring: MentoringItemDto[];
    @ApiProperty({ type: [ReferenceItemDto] })
    references: ReferenceItemDto[];
}

export class EvaluationDraftRequestDto {
    @ApiProperty({ example: 1 })
    cycleId: number;
    @ApiProperty({ type: DraftDto })
    draft: DraftDto;
}

export class EvaluationDraftResponseDto {
    @ApiProperty({ example: 1 })
    id: number;
    @ApiProperty({ example: 1 })
    userId: number;
    @ApiProperty({ example: 1 })
    cycleId: number;
    @ApiProperty({ type: DraftDto })
    draft: DraftDto;
    @ApiProperty({ example: '2025-07-14T18:57:20.000Z' })
    createdAt: string;
    @ApiProperty({ example: '2025-07-14T18:57:20.000Z' })
    updatedAt: string;
}

export const evaluationDraftRequestExample = {
    summary: 'Exemplo de envio de rascunho de avaliação',
    value: {
        cycleId: 1,
        draft: {
            selfAssessment: [
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
            evaluation360: [
                {
                    evaluateeId: 2,
                    strengths: 'Ótimo trabalho em equipe',
                    improvements: 'Precisa melhorar organização',
                    rating: 4,
                },
            ],
            mentoring: [
                {
                    justification: 'Justifique sua avaliação do mentor',
                    rating: 4,
                },
            ],
            references: [
                {
                    collaboratorId: 5,
                    justification: 'Justifique sua escolha',
                },
            ],
        },
    },
};

export const evaluationDraftResponseExample = {
    summary: 'Exemplo de resposta de draft de avaliação',
    value: {
        id: 1,
        userId: 1,
        cycleId: 1,
        draft: {
            selfAssessment: [
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
            evaluation360: [
                {
                    evaluateeId: 2,
                    strengths: 'Ótimo trabalho em equipe',
                    improvements: 'Precisa melhorar organização',
                    rating: 4,
                },
            ],
            mentoring: [
                {
                    justification: 'Justifique sua avaliação do mentor',
                    rating: 4,
                },
            ],
            references: [
                {
                    collaboratorId: 5,
                    justification: 'Justifique sua escolha',
                },
            ],
        },
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
        cycleId: 1,
        draft: {
            selfAssessment: [
                {
                    pillarId: 10,
                    criteriaId: 1,
                    rating: 3,
                    justification: 'Justifique sua nota',
                },
                {
                    pillarId: 10,
                    criteriaId: 2,
                    rating: 4,
                    justification: 'Me mostrei resiliente em situações complicadas',
                },
            ],
            evaluation360: [
                {
                    evaluateeId: 2,
                    strengths: 'Ótimo trabalho em equipe',
                    improvements: 'Precisa melhorar organização',
                    rating: 4,
                },
            ],
            mentoring: [
                {
                    justification: 'Justifique sua avaliação do mentor',
                    rating: 4,
                },
            ],
            references: [
                {
                    collaboratorId: 5,
                    justification: 'Justifique sua escolha',
                },
            ],
        },
    },
};

export const evaluationResponseExample = {
    summary: 'Exemplo de resposta de avaliação criada',
    value: {
        id: 123,
        cycleId: 1,
        draft: {
            autoEvaluation: [
                {
                    pillarId: 10,
                    criteriaId: 1,
                    rating: 3,
                    justification: 'Justifique sua nota',
                },
                {
                    pillarId: 10,
                    criteriaId: 2,
                    rating: 4,
                    justification: 'Me mostrei resiliente em situações complicadas',
                },
            ],
            evaluation360: [
                {
                    evaluateeId: 2,
                    strengths: 'Ótimo trabalho em equipe',
                    improvements: 'Precisa melhorar organização',
                    rating: 4,
                },
            ],
            mentoring: [
                {
                    justification: 'Justifique sua avaliação do mentor',
                    rating: 4,
                },
            ],
            references: [
                {
                    collaboratorId: 5,
                    justification: 'Justifique sua escolha',
                },
            ],
        },
        createdAt: '2025-07-14T18:57:20.000Z',
        updatedAt: '2025-07-14T18:57:20.000Z',
    },
};
