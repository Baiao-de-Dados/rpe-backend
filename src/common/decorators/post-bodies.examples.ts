export const exampleAutoEvaluation = {
    userId: 1,
    cycleId: 1,
    trackId: 1,
    criteria: [
        { criterionId: 1, score: 4.5 },
        { criterionId: 2, score: 3.8 },
    ],
};

export const exampleLeaderEvaluation = {
    leaderId: 2,
    collaboratorId: 3,
    cycleId: 1,
    trackId: 1,
    criteria: [
        { criterionId: 1, score: 4.0 },
        { criterionId: 2, score: 4.2 },
    ],
};

export const exampleManagerEvaluation = {
    managerId: 1,
    collaboratorId: 3,
    cycleId: 1,
    trackId: 1,
    criteria: [
        { criterionId: 1, score: 4.7 },
        { criterionId: 2, score: 4.0 },
    ],
};

export const exampleManagerEvaluationFull = {
    cycleId: 1,
    managerId: 10,
    collaboratorId: 20,
    criterias: [
        { criteriaId: 1, score: 5, justification: 'Excelente desempenho em liderança.' },
        { criteriaId: 2, score: 4, justification: 'Boa comunicação, mas pode melhorar.' },
    ],
};

export const exampleAssignLeader = {
    projectId: 1,
    leaderId: 2,
};

export const exampleAssignLeaderEvaluation = {
    collaboratorId: 20,
    cycleId: 1,
    leaderId: 2, // pode ser null ou omitido
};

// Adicione outros exemplos conforme necessário para outros endpoints POST
