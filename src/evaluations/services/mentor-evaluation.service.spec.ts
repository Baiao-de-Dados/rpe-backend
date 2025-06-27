import { Test, TestingModule } from '@nestjs/testing';
import { MentorEvaluationService } from './mentor-evaluation.service';
import { CycleValidationService } from './cycle-validation.service';
import { BadRequestException } from '@nestjs/common';

describe('MentorEvaluationService', () => {
    let service: MentorEvaluationService;
    let mockPrismaService: any;
    let mockCycleValidationService: any;

    const mockMentoring = [
        {
            mentorId: '3',
            justificativa: 'Acompanhamento semanal',
            leaderId: '4',
            leaderJustificativa: 'Avaliação do líder',
        },
    ];

    beforeEach(async () => {
        mockPrismaService = {
            evaluation: {
                create: jest.fn(),
            },
        };

        mockCycleValidationService = {
            validateActiveCycle: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MentorEvaluationService,
                {
                    provide: CycleValidationService,
                    useValue: mockCycleValidationService,
                },
            ],
        }).compile();

        service = module.get<MentorEvaluationService>(MentorEvaluationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createMentorEvaluations', () => {
        it('should create mentor and leader evaluations successfully', async () => {
            // Arrange
            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.evaluation.create
                .mockResolvedValueOnce({
                    id: 1,
                    type: 'MENTOR',
                    evaluatorId: 3,
                    evaluateeId: 1,
                    cycle: 20241,
                    justification: 'Acompanhamento semanal',
                    score: 0,
                })
                .mockResolvedValueOnce({
                    id: 2,
                    type: 'LEADER',
                    evaluatorId: 4,
                    evaluateeId: 1,
                    cycle: 20241,
                    justification: 'Avaliação do líder',
                    score: 0,
                });

            // Act
            const result = await service.createMentorEvaluations(
                mockPrismaService,
                mockMentoring,
                1,
                '2024-Q1',
            );

            // Assert
            expect(mockCycleValidationService.validateActiveCycle).toHaveBeenCalledWith(
                mockPrismaService,
                'MENTOR/LEADER',
            );
            expect(mockPrismaService.evaluation.create).toHaveBeenCalledTimes(2);
            expect(mockPrismaService.evaluation.create).toHaveBeenNthCalledWith(1, {
                data: {
                    type: 'MENTOR',
                    evaluatorId: 3,
                    evaluateeId: 1,
                    cycle: 20241,
                    justification: 'Acompanhamento semanal',
                    score: 0,
                },
            });
            expect(mockPrismaService.evaluation.create).toHaveBeenNthCalledWith(2, {
                data: {
                    type: 'LEADER',
                    evaluatorId: 4,
                    evaluateeId: 1,
                    cycle: 20241,
                    justification: 'Avaliação do líder',
                    score: 0,
                },
            });
            expect(result).toHaveLength(2);
        });

        it('should create only mentor evaluation when leaderId is not provided', async () => {
            // Arrange
            const mentoringWithoutLeader = [
                {
                    mentorId: '3',
                    justificativa: 'Acompanhamento semanal',
                },
            ];

            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.evaluation.create.mockResolvedValue({
                id: 1,
                type: 'MENTOR',
                evaluatorId: 3,
                evaluateeId: 1,
                cycle: 20241,
                justification: 'Acompanhamento semanal',
                score: 0,
            });

            // Act
            const result = await service.createMentorEvaluations(
                mockPrismaService,
                mentoringWithoutLeader,
                1,
                '2024-Q1',
            );

            // Assert
            expect(mockPrismaService.evaluation.create).toHaveBeenCalledTimes(1);
            expect(mockPrismaService.evaluation.create).toHaveBeenCalledWith({
                data: {
                    type: 'MENTOR',
                    evaluatorId: 3,
                    evaluateeId: 1,
                    cycle: 20241,
                    justification: 'Acompanhamento semanal',
                    score: 0,
                },
            });
            expect(result).toHaveLength(1);
        });

        it('should throw error if mentorId is missing', async () => {
            // Arrange
            const invalidMentoring = [
                {
                    justificativa: 'Acompanhamento semanal',
                    leaderId: '4',
                    leaderJustificativa: 'Avaliação do líder',
                },
            ];

            // Act & Assert
            await expect(
                service.createMentorEvaluations(mockPrismaService, invalidMentoring, 1, '2024-Q1'),
            ).rejects.toThrow(new BadRequestException('ID do mentor é obrigatório'));
        });

        it('should throw error if justificativa is missing', async () => {
            // Arrange
            const invalidMentoring = [
                {
                    mentorId: '3',
                    leaderId: '4',
                    leaderJustificativa: 'Avaliação do líder',
                },
            ];

            // Act & Assert
            await expect(
                service.createMentorEvaluations(mockPrismaService, invalidMentoring, 1, '2024-Q1'),
            ).rejects.toThrow(new BadRequestException('Justificativa do mentor é obrigatória'));
        });

        it('should throw error if leaderId is provided but leaderJustificativa is missing', async () => {
            // Arrange
            const invalidMentoring = [
                {
                    mentorId: '3',
                    justificativa: 'Acompanhamento semanal',
                    leaderId: '4',
                },
            ];

            // Act & Assert
            await expect(
                service.createMentorEvaluations(mockPrismaService, invalidMentoring, 1, '2024-Q1'),
            ).rejects.toThrow(new BadRequestException('Justificativa do líder é obrigatória'));
        });

        it('should handle empty array', async () => {
            // Act & Assert
            await expect(
                service.createMentorEvaluations(mockPrismaService, [], 1, '2024-Q1'),
            ).rejects.toThrow(new BadRequestException('Array de mentoria é obrigatório'));
        });

        it('should handle database errors', async () => {
            // Arrange
            const error = new Error('Database error');
            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.evaluation.create.mockRejectedValue(error);

            // Act & Assert
            await expect(
                service.createMentorEvaluations(mockPrismaService, mockMentoring, 1, '2024-Q1'),
            ).rejects.toThrow(error);
        });
    });
});
