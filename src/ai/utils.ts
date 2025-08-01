import { GeminiNotesResponseDto } from './dto/response/gemini-notes-response.dto';
import { GeminiCollaboratorResponseDto } from './dto/response/gemini-collaborator-response.dto';
import { GeminiEqualizationResponseDto } from './dto/response/gemini-equalization-response.dto';
import { GeminiLeaderResponseDto } from './dto/response/gemini-leader-response.dto';

export type GeminiSelfAssessmentItem = {
    pillarId: number;
    criteriaId: number;
    rating: number;
    justification: string;
};

export type GeminiEvaluation360Item = {
    collaboratorId: number;
    rating: number;
    strengths: string;
    improvements: string;
};

export type GeminiMentoringItem = {
    rating: number;
    justification: string;
};

export type GeminiReferenceItem = {
    collaboratorId: number;
    justification: string;
};

function isValidNoInsightResponse(data: any): boolean {
    return typeof data === 'object' && data?.code === 'NO_INSIGHT';
}

function isValidSelfAssessmentItem(item: GeminiSelfAssessmentItem): boolean {
    return (
        typeof item === 'object' &&
        typeof item.criteriaId === 'number' &&
        typeof item.pillarId === 'number' &&
        typeof item.rating === 'number' &&
        item.rating >= 0 &&
        item.rating <= 5 &&
        typeof item.justification === 'string'
    );
}

function isValidEvaluation360Item(item: GeminiEvaluation360Item): boolean {
    return (
        typeof item === 'object' &&
        typeof item.collaboratorId === 'number' &&
        typeof item.rating === 'number' &&
        item.rating >= 1 &&
        item.rating <= 5 &&
        typeof item.strengths === 'string' &&
        typeof item.improvements === 'string'
    );
}

function isValidMentoringItem(item: GeminiMentoringItem): boolean {
    return (
        typeof item === 'object' &&
        typeof item.rating === 'number' &&
        item.rating >= 1 &&
        item.rating <= 5 &&
        typeof item.justification === 'string' &&
        item.justification.trim() !== ''
    );
}

function isValidReferencesItem(item: GeminiReferenceItem): boolean {
    return (
        typeof item === 'object' &&
        typeof item.collaboratorId === 'number' &&
        typeof item.justification === 'string' &&
        item.justification.trim() !== ''
    );
}

function isValidGeminiNotesResponse(data: GeminiNotesResponseDto): boolean {
    return (
        typeof data === 'object' &&
        (data.mentoring === null || isValidMentoringItem(data.mentoring as GeminiMentoringItem)) &&
        Array.isArray(data.references) &&
        data.references.every(isValidReferencesItem) &&
        Array.isArray(data.evaluation360) &&
        data.evaluation360.every(isValidEvaluation360Item) &&
        Array.isArray(data.selfAssessment) &&
        data.selfAssessment.every(isValidSelfAssessmentItem)
    );
}

function isValidNoIdentificationResponse(data: any): boolean {
    return (
        typeof data === 'object' &&
        data?.code === 'NO_IDENTIFICATION' &&
        typeof (data.written as string) === 'string' &&
        (data.written as string).trim() !== '' &&
        Array.isArray(data.applicable) &&
        (data.applicable as Array<unknown>).every(
            (name) => typeof name === 'string' && name.trim() !== '',
        )
    );
}

export function cleanGeminiResponseText(text: string): string {
    return (text || '')
        .replace(/^```[a-zA-Z]*\n/, '')
        .replace(/```$/, '')
        .trim();
}

function isValidGeminiCollaboratorResponse(data: GeminiCollaboratorResponseDto): boolean {
    return (
        typeof data === 'object' &&
        (data.code === 'SUCCESS'
            ? typeof data.summary === 'string' &&
              data.summary.trim().length >= 200 &&
              data.summary.trim().length <= 500
            : data.code === 'NO_INSIGHT' || data.code === 'ERROR')
    );
}

function isValidGeminiEqualizationResponse(data: GeminiEqualizationResponseDto): boolean {
    return (
        typeof data === 'object' &&
        (data.code === 'SUCCESS'
            ? typeof data.rating === 'number' &&
              data.rating >= 1 &&
              data.rating <= 5 &&
              typeof data.detailedAnalysis === 'string' &&
              data.detailedAnalysis.trim().length >= 200 &&
              data.detailedAnalysis.trim().length <= 500 &&
              typeof data.summary === 'string' &&
              data.summary.trim().length >= 50 &&
              data.summary.trim().length <= 200 &&
              typeof data.discrepancies === 'string' &&
              data.discrepancies.trim().length >= 100 &&
              data.discrepancies.trim().length <= 300
            : data.code === 'NO_INSIGHT' || data.code === 'ERROR')
    );
}

function isValidGeminiLeaderResponse(data: GeminiLeaderResponseDto): boolean {
    return (
        typeof data === 'object' &&
        (data.code === 'SUCCESS'
            ? typeof data.summary === 'string' &&
              data.summary.trim().length >= 200 &&
              data.summary.trim().length <= 500
            : data.code === 'NO_INSIGHT' || data.code === 'ERROR')
    );
}

export {
    isValidMentoringItem,
    isValidReferencesItem,
    isValidEvaluation360Item,
    isValidSelfAssessmentItem,
    isValidGeminiNotesResponse,
    isValidGeminiLeaderResponse,
    isValidGeminiEqualizationResponse,
    isValidGeminiCollaboratorResponse,
    isValidNoInsightResponse,
    isValidNoIdentificationResponse,
};
