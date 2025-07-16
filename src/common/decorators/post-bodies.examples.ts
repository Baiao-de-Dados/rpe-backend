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
    cycleConfigId: 1,
    managerId: 10,
    colaboradorId: 20,
    autoavaliacao: {
        pilares: [
            {
                pilarId: 1,
                criterios: [
                    { criterioId: 1, nota: 5, justificativa: 'Excelente desempenho em liderança.' },
                    { criterioId: 2, nota: 4, justificativa: 'Boa comunicação, mas pode melhorar.' },
                ],
            },
            {
                pilarId: 2,
                criterios: [
                    { criterioId: 3, nota: 4, justificativa: 'Bom trabalho em equipe.' },
                    { criterioId: 4, nota: 3, justificativa: 'Precisa melhorar organização.' },
                ],
            },
        ],
    },
};

export const exampleManagerEvaluationFull = {
    cycleConfigId: 1,
    managerId: 10,
    colaboradorId: 20,
    autoavaliacao: {
        pilares: [
            {
                pilarId: 1,
                criterios: [
                    { criterioId: 1, nota: 5, justificativa: 'Excelente desempenho em liderança.' },
                    { criterioId: 2, nota: 4, justificativa: 'Boa comunicação, mas pode melhorar.' },
                ],
            },
        ],
    },
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
