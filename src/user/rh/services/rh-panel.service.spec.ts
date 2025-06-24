import { Test, TestingModule } from '@nestjs/testing';
import { RhPanelService } from './rh-panel.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('RhPanelService', () => {
    let service: RhPanelService;
    let mockPrismaService: jest.Mocked<PrismaService>;

    beforeEach(async () => {
        const mockPrisma = {
            evaluation: {
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RhPanelService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<RhPanelService>(RhPanelService);
        mockPrismaService = module.get(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDashboardStats', () => {
        it('should return dashboard statistics for RH', async () => {
            const mockEvaluations = [
                {
                    id: 1,
                    cycle: '2024-01',
                    userId: 1,
                    createdAt: new Date(),
                    grade: 0,
                    user: { id: 1, name: 'User 1', email: 'user1@test.com' },
                    autoEvaluation: null,
                    evaluation360: null,
                    mentoring: null,
                    references: null,
                },
                {
                    id: 2,
                    cycle: '2024-01',
                    userId: 2,
                    createdAt: new Date(),
                    grade: 0,
                    user: { id: 2, name: 'User 2', email: 'user2@test.com' },
                    autoEvaluation: { id: 1, evaluationId: 2, justification: 'Test' },
                    evaluation360: null,
                    mentoring: null,
                    references: null,
                },
                {
                    id: 3,
                    cycle: '2024-02',
                    userId: 3,
                    createdAt: new Date(),
                    grade: 0,
                    user: { id: 3, name: 'User 3', email: 'user3@test.com' },
                    autoEvaluation: null,
                    evaluation360: {
                        id: 1,
                        evaluationId: 3,
                        evaluatorId: 4,
                        evaluatedId: 3,
                        strengths: 'Test',
                        improvements: 'Test',
                    },
                    mentoring: null,
                    references: null,
                },
            ];

            jest.spyOn(mockPrismaService.evaluation, 'findMany').mockResolvedValue(mockEvaluations);

            const result = await service.getDashboardStats();

            expect(result).toEqual({
                overall: {
                    totalEvaluations: 3,
                    totalCompleted: 2,
                    totalPending: 1,
                    completionPercentage: 67,
                },
                cycles: [
                    {
                        cycle: '2024-01',
                        totalEvaluations: 2,
                        completedEvaluations: 1,
                        pendingEvaluations: 1,
                        completionPercentage: 50,
                        breakdown: {
                            autoEvaluation: 1,
                            evaluation360: 0,
                            mentoring: 0,
                            references: 0,
                        },
                        cycleEndDate: '2024-01-31',
                    },
                    {
                        cycle: '2024-02',
                        totalEvaluations: 1,
                        completedEvaluations: 1,
                        pendingEvaluations: 0,
                        completionPercentage: 100,
                        breakdown: {
                            autoEvaluation: 0,
                            evaluation360: 1,
                            mentoring: 0,
                            references: 0,
                        },
                        cycleEndDate: '2024-02-29',
                    },
                ],
                lastUpdated: expect.any(String),
            });
        });

        it('should handle empty evaluations list', async () => {
            jest.spyOn(mockPrismaService.evaluation, 'findMany').mockResolvedValue([]);

            const result = await service.getDashboardStats();

            expect(result).toEqual({
                overall: {
                    totalEvaluations: 0,
                    totalCompleted: 0,
                    totalPending: 0,
                    completionPercentage: 0,
                },
                cycles: [],
                lastUpdated: expect.any(String),
            });
        });

        it('should handle invalid cycle format', async () => {
            const mockEvaluations = [
                {
                    id: 1,
                    cycle: 'invalid-cycle',
                    userId: 1,
                    createdAt: new Date(),
                    grade: 0,
                    user: { id: 1, name: 'User 1', email: 'user1@test.com' },
                    autoEvaluation: null,
                    evaluation360: null,
                    mentoring: null,
                    references: null,
                },
            ];

            jest.spyOn(mockPrismaService.evaluation, 'findMany').mockResolvedValue(mockEvaluations);

            const result = await service.getDashboardStats();

            expect(result.cycles[0].cycleEndDate).toBe('N/A');
        });
    });
});
