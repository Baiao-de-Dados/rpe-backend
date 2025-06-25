import { Test, TestingModule } from '@nestjs/testing';
import { RhPanelController } from './rh-panel.controller';
import { RhPanelService } from '../services/rh-panel.service';

describe('RhPanelController', () => {
    let controller: RhPanelController;
    let mockRhPanelService: jest.Mocked<RhPanelService>;

    beforeEach(async () => {
        const mockService = {
            getDashboardStats: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RhPanelController],
            providers: [
                {
                    provide: RhPanelService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<RhPanelController>(RhPanelController);
        mockRhPanelService = module.get(RhPanelService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('GET /rh/panel/dashboard', () => {
        it('should return dashboard statistics', async () => {
            const mockDashboardStats = {
                overall: {
                    totalEvaluations: 10,
                    totalCompleted: 7,
                    totalPending: 3,
                    completionPercentage: 70,
                },
                cycles: [
                    {
                        cycle: '2024-01',
                        totalEvaluations: 5,
                        completedEvaluations: 4,
                        pendingEvaluations: 1,
                        completionPercentage: 80,
                        breakdown: {
                            autoEvaluation: 3,
                            evaluation360: 2,
                            mentoring: 1,
                            references: 1,
                        },
                        cycleEndDate: '2024-01-31',
                    },
                ],
                lastUpdated: '2024-01-15T10:00:00.000Z',
            };

            jest.spyOn(mockRhPanelService, 'getDashboardStats').mockResolvedValue(
                mockDashboardStats,
            );

            const result = await controller.getDashboardStats();

            expect(result).toEqual(mockDashboardStats);
        });
    });
});
