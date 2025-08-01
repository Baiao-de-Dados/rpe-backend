export interface CriterioDto {
    criterioId: number;
    nota: number;
    justificativa: string;
}

export interface PilarDto {
    pilarId: number;
    criterios: CriterioDto[];
}

export interface AutoAvaliacaoDto {
    pilares: PilarDto[];
}

export interface Avaliacao360Dto {
    avaliadoId: number;
    pontosFortes?: string;
    pontosMelhoria?: string;
}

export interface MentoringDto {
    mentorId: number;
    justificativa: string;
    score?: number;
    leaderId?: number;
    leaderJustificativa?: string;
}

export interface ReferenciaDto {
    colaboradorId: number;
    justificativa: string;
}
