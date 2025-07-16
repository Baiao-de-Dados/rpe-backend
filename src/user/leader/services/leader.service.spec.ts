import { Test, TestingModule } from '@nestjs/testing';
import { LeaderService } from './leader.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('LeaderService', () => {
    let service: LeaderService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LeaderService,
                {
                    provide: PrismaService,
                    useValue: {
                        leaderEvaluationAssignment: { findFirst: jest.fn(), findMany: jest.fn() },
                        leaderEvaluation: {
                            findFirst: jest.fn(),
                            findMany: jest.fn(),
                            update: jest.fn(),
                            create: jest.fn(),
                        },
                        evaluation: { findMany: jest.fn(), findFirst: jest.fn() },
                        managerEvaluation: { findMany: jest.fn(), findFirst: jest.fn() },
                        equalization: { findMany: jest.fn(), findFirst: jest.fn() },
                        cycleConfig: { findMany: jest.fn(), findUnique: jest.fn() },
                    },
                },
            ],
        }).compile();
        service = module.get<LeaderService>(LeaderService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    describe('evaluate', () => {
        it('deve lançar erro se não houver assignment', async () => {
            (prisma.leaderEvaluationAssignment.findFirst as jest.Mock).mockResolvedValue(null);
            await expect(service.evaluate({} as any)).rejects.toThrow(BadRequestException);
        });
        it('deve atualizar avaliação existente', async () => {
            (prisma.leaderEvaluationAssignment.findFirst as jest.Mock).mockResolvedValue({});
            (prisma.leaderEvaluation.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
            (prisma.leaderEvaluation.update as jest.Mock).mockResolvedValue({ id: 1, score: 5 });
            const result = await service.evaluate({} as any);
            expect(result).toEqual({ id: 1, score: 5 });
        });
        it('deve criar nova avaliação se não existir', async () => {
            (prisma.leaderEvaluationAssignment.findFirst as jest.Mock).mockResolvedValue({});
            (prisma.leaderEvaluation.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.leaderEvaluation.create as jest.Mock).mockResolvedValue({ id: 2, score: 4 });
            const result = await service.evaluate({} as any);
            expect(result).toEqual({ id: 2, score: 4 });
        });
    });

    describe('getDashboardSummary', () => {
        it('deve retornar resumo com médias', async () => {
            (prisma.leaderEvaluationAssignment.findMany as jest.Mock).mockResolvedValue([
                {
                    collaboratorId: 1,
                    cycleId: 1,
                    collaborator: {
                        id: 1,
                        name: 'A',
                        email: 'a@a.com',
                        position: 'dev',
                        track: { id: 1, name: 'Backend' },
                    },
                },
            ]);
            (prisma.leaderEvaluation.findMany as jest.Mock).mockResolvedValue([{ score: 8 }]);
            (prisma.managerEvaluation.findMany as jest.Mock).mockResolvedValue([
                { criterias: [{ score: 7 }] },
            ]);
            const result = await service.getDashboardSummary(1);
            expect(result.averageScoreGiven).toBe(8);
            expect(result.averageManagerScoreForMyTeam).toBe(7);
            expect(result.totalAssignments).toBe(1);
        });
    });

    describe('getCollaboratorsEvaluationsSummary', () => {
        it('deve retornar array vazio se não houver assignments', async () => {
            (prisma.leaderEvaluationAssignment.findMany as jest.Mock).mockResolvedValue([]);
            const result = await service.getCollaboratorsEvaluationsSummary(1);
            expect(result).toEqual([]);
        });
        // Testes de lógica podem ser expandidos conforme necessário
    });

    describe('getBrutalfacts', () => {
        it('deve retornar 0 se não houver assignments', async () => {
            (prisma.leaderEvaluationAssignment.findMany as jest.Mock).mockResolvedValue([]);
            const result = await service.getBrutalfacts(1);
            expect(result.totalLideradosAvaliados).toBe(0);
        });
        it('deve calcular média pós-equalização', async () => {
            (prisma.leaderEvaluationAssignment.findMany as jest.Mock).mockResolvedValue([
                { collaboratorId: 1, cycleId: 1 },
                { collaboratorId: 2, cycleId: 1 },
            ]);
            (prisma.equalization.findMany as jest.Mock).mockResolvedValue([
                { collaboratorId: 1, cycleId: 1, score: 8 },
                { collaboratorId: 2, cycleId: 1, score: 10 },
            ]);
            (prisma.leaderEvaluation.findMany as jest.Mock).mockResolvedValue([]);
            const result = await service.getBrutalfacts(1);
            expect(result.mediaGeralPosEqualizacao).toBe(9);
        });
    });

    describe('getEvaluation', () => {
        it('deve buscar avaliação do líder', async () => {
            (prisma.leaderEvaluation.findFirst as jest.Mock).mockResolvedValue({ id: 1, score: 7 });
            const result = await service.getEvaluation(1, 2, 3);
            expect(result).toEqual({ id: 1, score: 7 });
        });
    });

    describe('getAverageEqualizationByCycle', () => {
        it('deve retornar médias por ciclo', async () => {
            (prisma.leaderEvaluationAssignment.findMany as jest.Mock).mockResolvedValue([
                { cycleId: 1, cycle: { name: '2024.1' }, collaboratorId: 1 },
                { cycleId: 1, cycle: { name: '2024.1' }, collaboratorId: 2 },
                { cycleId: 2, cycle: { name: '2024.2' }, collaboratorId: 3 },
            ]);
            (prisma.equalization.findMany as jest.Mock).mockImplementation(({ where }) => {
                if (where.cycleId === 1) {
                    return Promise.resolve([
                        { collaboratorId: 1, cycleId: 1, score: 8 },
                        { collaboratorId: 2, cycleId: 1, score: 10 },
                    ]);
                }
                if (where.cycleId === 2) {
                    return Promise.resolve([{ collaboratorId: 3, cycleId: 2, score: 9 }]);
                }
                return Promise.resolve([]);
            });
            const result = await service.getAverageEqualizationByCycle(1);
            console.log('SAÍDA DO TESTE:', result);
            expect(result).toEqual([
                { cycleId: 1, cycleName: '2024.1', averageEqualizationScore: 9 },
                { cycleId: 2, cycleName: '2024.2', averageEqualizationScore: 9 },
            ]);
        });
    });
});
