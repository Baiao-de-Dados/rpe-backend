import { ApiProperty } from '@nestjs/swagger';

export class CommitteeDashboardMetrics {
    @ApiProperty({ example: 50 })
    totalCollaborators: number;

    @ApiProperty({ example: 15 })
    pendingEqualizations: number;

    @ApiProperty({ example: 35 })
    completedEqualizations: number;

    @ApiProperty({ example: 70 })
    completionPercentage: number;

    @ApiProperty({ example: 5 })
    daysToDeadline: number;

    @ApiProperty({ example: '2024-12-31' })
    deadlineDate: string;
}

export class CommitteeCollaboratorsSummary {
    @ApiProperty({
        example: {
            id: 1,
            name: 'João Silva',
            position: 'Desenvolvedor Senior'
        }
    })
    collaborator: {
        id: number;
        name: string;
        position: string;
    };

    @ApiProperty({ example: 4.2, nullable: true })
    autoEvaluation: number | null;

    @ApiProperty({ example: 4.5, nullable: true })
    evaluation360: number | null;

    @ApiProperty({ example: 4.0, nullable: true })
    managerEvaluation: number | null;

    @ApiProperty({ example: 4.3, nullable: true })
    committeeEqualization: number | null;

    @ApiProperty({ example: 'completed', enum: ['pending', 'completed'] })
    status: 'pending' | 'completed';
}

export class CommitteeCollaboratorDetails {
    @ApiProperty({
        example: {
            id: 1,
            name: 'João Silva',
            position: 'Desenvolvedor Senior',
            email: 'joao@empresa.com',
            track: { id: 1, name: 'Desenvolvimento' }
        }
    })
    collaborator: {
        id: number;
        name: string;
        position: string;
        email: string;
        track: { id: number; name: string };
    };

    @ApiProperty({
        example: {
            id: 1,
            name: 'Ciclo 2024.2',
            startDate: '2024-07-01',
            endDate: '2024-12-31'
        }
    })
    cycle: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
    };

    @ApiProperty({
        example: {
            score: 4.2,
            criteria: [
                {
                    pilarId: 1,
                    criterionId: 1,
                    rating: 4,
                    justification: 'Excelente desempenho técnico'
                }
            ]
        },
        nullable: true
    })
    autoEvaluation: {
        score: number;
        criteria: Array<{
            pilarId: number;
            criterionId: number;
            rating: number;
            justification: string;
        }>;
    } | null;

    @ApiProperty({
        example: [
            {
                collaboratorName: 'Maria Santos',
                collaboratorPosition: 'Tech Lead',
                rating: 4.5,
                improvements: 'Pode melhorar documentação',
                strengths: 'Excelente código limpo'
            }
        ]
    })
    evaluation360: Array<{
        collaboratorName: string;
        collaboratorPosition: string;
        rating: number;
        improvements: string;
        strengths: string;
    }>;

    @ApiProperty({
        example: {
            score: 4.0,
            criteria: [
                {
                    pilarId: 1,
                    criterionId: 1,
                    rating: 4,
                    justification: 'Bom desempenho geral'
                }
            ]
        },
        nullable: true
    })
    managerEvaluation: {
        score: number;
        criteria: Array<{
            pilarId: number;
            criterionId: number;
            rating: number;
            justification: string;
        }>;
    } | null;

    @ApiProperty({
        example: {
            finalScore: 4.3,
            comments: 'Nota final após análise do comitê',
            committee: {
                id: 5,
                name: 'João Silva',
                position: 'Membro do Comitê'
            },
            lastUpdated: '2024-01-01T00:00:00.000Z'
        },
        nullable: true
    })
    committeeEqualization: {
        finalScore: number;
        comments: string;
        committee: {
            id: number;
            name: string;
            position: string;
        };
        lastUpdated: string;
    } | null;
}

export class CommitteeEqualizationHistory {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 123 })
    equalizationId: number;

    @ApiProperty({ example: 5 })
    committeeId: number;

    @ApiProperty({ example: 4.0, nullable: true })
    previousScore: number | null;

    @ApiProperty({ example: 4.5, nullable: true })
    newScore: number | null;

    @ApiProperty({ example: 'Nota inicial', nullable: true })
    previousJustification: string | null;

    @ApiProperty({ example: 'Nota final após análise' })
    newJustification: string;

    @ApiProperty({ example: 'Revisão após feedback do manager', nullable: true })
    changeReason: string | null;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    createdAt: string;

    @ApiProperty({
        example: {
            id: 5,
            name: 'João Silva',
            position: 'Membro do Comitê'
        }
    })
    committee: {
        id: number;
        name: string;
        position: string;
    };
} 