import { Test, TestingModule } from '@nestjs/testing';
import { EmployerService } from './employer.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('EmployerService', () => {
    let service: EmployerService;
    let prisma: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmployerService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: { findUnique: jest.fn() },
                        cycleConfig: { findMany: jest.fn() },
                        evaluation: { findFirst: jest.fn(), findMany: jest.fn() },
                        managerEvaluation: { findFirst: jest.fn(), findMany: jest.fn() },
                        criterionTrackCycleConfig: { findFirst: jest.fn() },
                        evaluation360: { findMany: jest.fn() },
                        reference: { findMany: jest.fn() },
                        mentoring: { findFirst: jest.fn() },
                        autoEvaluation: { findUnique: jest.fn() },
                        equalization: { findFirst: jest.fn() },
                    },
                },
            ],
        }).compile();
        service = module.get<EmployerService>(EmployerService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('deve retornar histórico de ciclos com avaliações detalhadas', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, trackId: 10 });
        prisma.cycleConfig.findMany.mockResolvedValue([{ id: 1, name: '2024.1' }]);
        prisma.evaluation.findFirst.mockResolvedValue({
            autoEvaluation: {
                assignments: [
                    {
                        criterion: { name: 'Critério X', pillar: { name: 'Pilar Y' } },
                        criterionId: 100,
                        score: 4,
                        justification: 'Bom trabalho',
                    },
                ],
            },
        });
        prisma.managerEvaluation.findFirst.mockResolvedValue({ criterias: [{ score: 3 }] });
        prisma.criterionTrackCycleConfig.findFirst.mockResolvedValue({ weight: 20 });
        prisma.evaluation.findMany.mockResolvedValue([{ id: 2, evaluatorId: 99 }]);
        prisma.evaluation360.findMany.mockResolvedValue([
            {
                score: 5,
                improvements: 'Melhorar comunicação',
                strengths: 'Ótimo trabalho em equipe',
                evaluation: { evaluator: { name: 'Fulano', position: 'Tech Lead' } },
            },
        ]);
        prisma.reference.findMany.mockResolvedValue([
            {
                justification: 'Referência positiva',
                evaluation: { evaluator: { name: 'Beltrano', position: 'Manager' } },
            },
        ]);
        prisma.mentoring.findFirst.mockResolvedValue({
            score: 4,
            justification: 'Boa mentoria',
            evaluation: { evaluator: { name: 'Mentor', position: 'Mentor' } },
        });

        const result = await service.getCollaboratorCyclesHistory(1);
        expect(result.cycles.length).toBe(1);
        expect(result.cycles[0].cycleName).toBe('2024.1');
        expect(result.cycles[0].selfAssessment.pillars[0].pillarName).toBe('Pilar Y');
        expect(result.cycles[0].selfAssessment.pillars[0].criteria[0].weight).toBe(20);
        expect(result.cycles[0].evaluation360.evaluation[0].collaratorName).toBe('Fulano');
        expect(result.cycles[0].reference[0].collaratorName).toBe('Beltrano');
        expect(result.cycles[0].mentoring.mentorName).toBe('Mentor');
    });

    it('deve retornar as notas de cada ciclo no formato esperado', async () => {
        // Mock dos dados de avaliações
        prisma.evaluation.findMany.mockResolvedValue([
            {
                id: 1,
                cycleConfigId: 10,
                cycleConfig: { id: 10, name: '2025.2' },
            },
            {
                id: 2,
                cycleConfigId: 11,
                cycleConfig: { id: 11, name: '2025.3' },
            },
        ]);
        // Mock das avaliações de gestor
        prisma.managerEvaluation.findMany.mockResolvedValue([
            { cycleId: 10, criterias: [{ score: 5 }, { score: 5 }] },
            { cycleId: 11, criterias: [{ score: 4 }, { score: 6 }] },
        ]);
        // Mock da autoavaliação
        prisma.autoEvaluation.findUnique
            .mockResolvedValueOnce({ assignments: [{ score: 5 }, { score: 5 }] })
            .mockResolvedValueOnce({ assignments: [{ score: 4 }, { score: 6 }] });
        // Mock da avaliação 360
        prisma.evaluation360.findMany
            .mockResolvedValueOnce([{ score: 5 }, { score: 5 }])
            .mockResolvedValueOnce([{ score: 4 }, { score: 6 }]);
        // Mock da equalização
        prisma.equalization.findFirst
            .mockResolvedValueOnce({ score: 5 })
            .mockResolvedValueOnce({ score: 6 });

        const result = await service.getCyclesGrades(1);
        expect(result).toEqual({
            cycles: [
                {
                    cycleId: 10,
                    cycleName: '2025.2',
                    autoEvaluation: 5,
                    evaluation360: 5,
                    managerEvaluation: 5,
                    finalEvaluation: 5,
                },
                {
                    cycleId: 11,
                    cycleName: '2025.3',
                    autoEvaluation: 5,
                    evaluation360: 5,
                    managerEvaluation: 5,
                    finalEvaluation: 6,
                },
            ],
        });
    });
});
