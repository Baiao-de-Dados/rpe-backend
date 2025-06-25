export interface CriterioDto {
    criterioId: string;
    nota: number;
    justificativa: string;
}

export interface PilarDto {
    pilarId: string;
    criterios: CriterioDto[];
}

export interface AutoAvaliacaoDto {
    pilares: PilarDto[];
}

export interface Avaliacao360Dto {
    avaliadoId: string;
    pontosFortes?: string;
    pontosMelhoria?: string;
    justificativa: string;
}

export interface MentoringDto {
    mentorId?: string;
    justificativa?: string;
    leaderId?: string;
    leaderJustificativa?: string;
}

export interface ReferenciaDto {
    colaboradorId: string;
    tagIds: number[];
    justificativa: string;
}
