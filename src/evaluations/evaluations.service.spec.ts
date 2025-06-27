/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsService } from './evaluations.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { MentorEvaluationService } from './services/mentor-evaluation.service';
import { ReferenceService } from './services/reference.service';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

describe('EvaluationsService', () => {
    let service: EvaluationsService;
    let mockAutoEvaluationService: any;
    let mockPeer360EvaluationService: any;
    let mockMentorEvaluationService: any;
    let mockReferenceService: any;
    let mockEvaluationValidationService: any;
    let mockPrismaService: any;

    const mockCreateEvaluationDto: CreateEvaluationDto = {
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

    const mockEvaluation = {
        id: 1,
        type: 'AUTOEVALUATION',
        evaluatorId: 1,
        evaluateeId: 1,
        cycle: 2024,
        justification: 'Autoavaliação',
        score: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        mockAutoEvaluationService = {
            createAutoEvaluation: jest.fn(),
        };

        mockPeer360EvaluationService = {
            createPeer360Evaluations: jest.fn(),
        };

        mockMentorEvaluationService = {
            createMentorEvaluations: jest.fn(),
        };

        mockReferenceService = {
            createReferences: jest.fn(),
        };

        mockEvaluationValidationService = {
            validateEvaluationData: jest.fn(),
        };

        mockPrismaService = {
            $transaction: jest.fn(),
            evaluation: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
            },
            reference: {
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EvaluationsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: EvaluationValidationService,
                    useValue: mockEvaluationValidationService,
                },
                {
                    provide: Peer360EvaluationService,
                    useValue: mockPeer360EvaluationService,
                },
                {
                    provide: ReferenceService,
                    useValue: mockReferenceService,
                },
                {
                    provide: AutoEvaluationService,
                    useValue: mockAutoEvaluationService,
                },
                {
                    provide: MentorEvaluationService,
                    useValue: mockMentorEvaluationService,
                },
            ],
        }).compile();

        service = module.get<EvaluationsService>(EvaluationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createEvaluation', () => {
        it('should create a complete evaluation successfully', async () => {
            // Arrange
            mockEvaluationValidationService.validateEvaluationData.mockResolvedValue(undefined);
            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                return await callback(mockPrismaService);
            });
            mockPrismaService.reference.findMany.mockResolvedValue([]);
            mockAutoEvaluationService.createAutoEvaluation.mockResolvedValue(mockEvaluation);
            mockPeer360EvaluationService.createPeer360Evaluations.mockResolvedValue([]);
            mockMentorEvaluationService.createMentorEvaluations.mockResolvedValue([]);
            mockReferenceService.createReferences.mockResolvedValue(undefined);

            // Act
            const result = await service.createEvaluation(
                mockCreateEvaluationDto,
                'Backend',
                'Developer',
            );

            // Assert
            expect(mockEvaluationValidationService.validateEvaluationData).toHaveBeenCalledWith(
                mockCreateEvaluationDto,
            );
            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(mockAutoEvaluationService.createAutoEvaluation).toHaveBeenCalledWith(
                mockPrismaService,
                mockCreateEvaluationDto.autoavaliacao,
                1,
                '2024-Q1',
                'Backend',
                'Developer',
            );
            expect(result).toBeDefined();
        });

        it('should handle validation errors', async () => {
            // Arrange
            const validationError = new Error('Validation failed');
            mockEvaluationValidationService.validateEvaluationData.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.createEvaluation(mockCreateEvaluationDto, 'Backend', 'Developer'),
            ).rejects.toThrow(validationError);
        });

        it('should handle service errors', async () => {
            // Arrange
            const serviceError = new Error('Service error');
            mockEvaluationValidationService.validateEvaluationData.mockResolvedValue(undefined);
            mockPrismaService.$transaction.mockRejectedValue(serviceError);

            // Act & Assert
            await expect(
                service.createEvaluation(mockCreateEvaluationDto, 'Backend', 'Developer'),
            ).rejects.toThrow(serviceError);
        });
    });

    describe('findAll', () => {
        it('should return all evaluations', async () => {
            // Arrange
            const mockEvaluations = [mockEvaluation];
            mockPrismaService.evaluation.findMany.mockResolvedValue(mockEvaluations);

            // Act
            const result = await service.findAll();

            // Assert
            expect(mockPrismaService.evaluation.findMany).toHaveBeenCalledWith({
                include: {
                    evaluator: true,
                    evaluatee: true,
                    CriteriaAssignment: {
                        include: {
                            criterion: {
                                include: {
                                    pillar: true,
                                },
                            },
                        },
                    },
                },
            });
            expect(result).toEqual([
                {
                    cycle: 2024,
                    userId: 1,
                    user: undefined,
                    evaluations: [mockEvaluation],
                },
            ]);
        });

        it('should return empty array when no evaluations exist', async () => {
            // Arrange
            mockPrismaService.evaluation.findMany.mockResolvedValue([]);

            // Act
            const result = await service.findAll();

            // Assert
            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database error');
            mockPrismaService.evaluation.findMany.mockRejectedValue(dbError);

            // Act & Assert
            await expect(service.findAll()).rejects.toThrow(dbError);
        });
    });

    describe('findOne', () => {
        it('should return a single evaluation by id', async () => {
            // Arrange
            const id = 1;
            mockPrismaService.evaluation.findUnique.mockResolvedValue(mockEvaluation);

            // Act
            const result = await service.findOne(id);

            // Assert
            expect(mockPrismaService.evaluation.findUnique).toHaveBeenCalledWith({
                where: { id },
                include: {
                    evaluator: true,
                    evaluatee: true,
                    CriteriaAssignment: {
                        include: {
                            criterion: {
                                include: {
                                    pillar: true,
                                },
                            },
                        },
                    },
                },
            });
            expect(result).toEqual(mockEvaluation);
        });

        it('should throw NotFoundException when evaluation not found', async () => {
            // Arrange
            const id = 999;
            mockPrismaService.evaluation.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findOne(id)).rejects.toThrow(
                new NotFoundException(`Avaliação com ID ${id} não encontrada`),
            );
        });

        it('should handle database errors', async () => {
            // Arrange
            const id = 1;
            const dbError = new Error('Database error');
            mockPrismaService.evaluation.findUnique.mockRejectedValue(dbError);

            // Act & Assert
            await expect(service.findOne(id)).rejects.toThrow(dbError);
        });
    });
});
