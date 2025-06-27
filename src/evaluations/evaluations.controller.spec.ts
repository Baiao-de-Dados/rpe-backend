import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CycleConfigService } from '../cycle-config/cycle-config.service';

describe('EvaluationsController', () => {
    let controller: EvaluationsController;
    let mockEvaluationsService: any;
    let mockPrismaService: any;
    let mockCycleConfigService: any;

    const mockEvaluation = {
        id: 1,
        type: 'AUTOEVALUATION',
        evaluatorId: 1,
        evaluateeId: 1,
        cycle: 2024,
        justification: 'Test',
        score: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockCreateEvaluationDto = {
        colaboradorId: '1',
        ciclo: '2024-Q1',
        autoavaliacao: {
            pilares: [
                {
                    pilarId: '1',
                    criterios: [
                        {
                            criterioId: '1',
                            nota: 8,
                            justificativa: 'Bom domínio técnico',
                        },
                    ],
                },
            ],
        },
        avaliacao360: [],
        mentoring: [],
        referencias: [],
    };

    beforeEach(async () => {
        mockEvaluationsService = {
            createEvaluation: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
        };

        mockPrismaService = {
            evaluation: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
            },
        };

        mockCycleConfigService = {
            getActiveCriteria: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EvaluationsController],
            providers: [
                {
                    provide: EvaluationsService,
                    useValue: mockEvaluationsService,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: CycleConfigService,
                    useValue: mockCycleConfigService,
                },
            ],
        }).compile();

        controller = module.get<EvaluationsController>(EvaluationsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create an evaluation successfully', async () => {
            // Arrange
            const mockUser = { id: 1, track: 'Backend', position: 'Developer' };
            mockEvaluationsService.createEvaluation.mockResolvedValue(mockEvaluation);

            // Act
            const result = await controller.create(mockCreateEvaluationDto, mockUser);

            // Assert
            expect(mockEvaluationsService.createEvaluation).toHaveBeenCalledWith(
                mockCreateEvaluationDto,
                mockUser.track,
                mockUser.position,
            );
            expect(result).toEqual(mockEvaluation);
        });

        it('should handle service errors', async () => {
            // Arrange
            const mockUser = { id: 1, track: 'Backend', position: 'Developer' };
            const error = new Error('Service error');
            mockEvaluationsService.createEvaluation.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.create(mockCreateEvaluationDto, mockUser)).rejects.toThrow(
                error,
            );
        });
    });

    describe('findAll', () => {
        it('should return all evaluations', async () => {
            // Arrange
            const mockEvaluations = [mockEvaluation];
            mockEvaluationsService.findAll.mockResolvedValue(mockEvaluations);

            // Act
            const result = await controller.findAll();

            // Assert
            expect(mockEvaluationsService.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockEvaluations);
        });

        it('should return empty array when no evaluations exist', async () => {
            // Arrange
            mockEvaluationsService.findAll.mockResolvedValue([]);

            // Act
            const result = await controller.findAll();

            // Assert
            expect(mockEvaluationsService.findAll).toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('should handle service errors properly', async () => {
            // Arrange
            const error = new Error('Database error');
            mockEvaluationsService.findAll.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.findAll()).rejects.toThrow(error);
        });
    });

    describe('findOne', () => {
        it('should return a single evaluation by id', async () => {
            // Arrange
            const id = 1;
            mockEvaluationsService.findOne.mockResolvedValue(mockEvaluation);

            // Act
            const result = await controller.findOne(id);

            // Assert
            expect(mockEvaluationsService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockEvaluation);
        });

        it('should handle NotFoundException properly', async () => {
            // Arrange
            const id = 999;
            const notFoundError = new NotFoundException('Evaluation not found');
            mockEvaluationsService.findOne.mockRejectedValue(notFoundError);

            // Act & Assert
            await expect(controller.findOne(id)).rejects.toThrow(notFoundError);
        });

        it('should handle other service errors properly', async () => {
            // Arrange
            const id = 1;
            const error = new Error('Database error');
            mockEvaluationsService.findOne.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.findOne(id)).rejects.toThrow(error);
        });
    });
});
