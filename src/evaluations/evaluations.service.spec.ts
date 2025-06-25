/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsService } from './evaluations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { MentorEvaluationService } from './services/mentor-evaluation.service';
import { ReferenceService } from './services/reference.service';
import { NotFoundException } from '@nestjs/common';

describe('EvaluationsService', () => {
    let service: EvaluationsService;
    let mockPrismaService: any;
    let mockValidationService: any;
    let mockAutoEvaluationService: any;
    let mockPeer360EvaluationService: any;
    let mockMentorEvaluationService: any;
    let mockReferenceService: any;

    const mockEvaluation = {
        id: 1,
        type: 'AUTOEVALUATION',
        evaluatorId: 1,
        evaluateeId: 1,
        cycle: 2024,
        justification: 'Test justification',
        score: 0,
        createdAt: new Date(),
    };

    const mockCreateEvaluationDto: CreateEvaluationDto = {
        ciclo: '2024-Q1',
        colaboradorId: '1',
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
        avaliacao360: [
            {
                avaliadoId: '2',
                pontosFortes: 'Ótima comunicação',
                pontosMelhoria: 'Precisa melhorar prazos',
                justificativa: 'Avaliação baseada no trabalho em equipe',
            },
        ],
        mentoring: [
            {
                mentorId: '3',
                justificativa: 'Acompanhamento semanal',
                leaderId: '4',
                leaderJustificativa: 'Avaliação do líder',
            },
        ],
        referencias: [
            {
                colaboradorId: '2',
                justificativa: 'Referência técnica',
                tagIds: [1],
            },
        ],
    };

    beforeEach(async () => {
        // Create simple mocks
        mockPrismaService = {
            evaluation: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
            },
            reference: {
                findMany: jest.fn(),
            },
            $transaction: jest.fn(),
        };

        mockValidationService = {
            validateEvaluationData: jest.fn(),
        };

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

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EvaluationsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: EvaluationValidationService,
                    useValue: mockValidationService,
                },
                {
                    provide: AutoEvaluationService,
                    useValue: mockAutoEvaluationService,
                },
                {
                    provide: Peer360EvaluationService,
                    useValue: mockPeer360EvaluationService,
                },
                {
                    provide: MentorEvaluationService,
                    useValue: mockMentorEvaluationService,
                },
                {
                    provide: ReferenceService,
                    useValue: mockReferenceService,
                },
            ],
        }).compile();

        service = module.get<EvaluationsService>(EvaluationsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createEvaluation', () => {
        it('should create a complete evaluation successfully', async () => {
            // Arrange
            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                return await callback(mockPrismaService);
            });
            mockPrismaService.$transaction = mockTransaction;

            mockAutoEvaluationService.createAutoEvaluation.mockResolvedValue(mockEvaluation);
            mockPeer360EvaluationService.createPeer360Evaluations.mockResolvedValue([
                mockEvaluation,
            ]);
            mockMentorEvaluationService.createMentorEvaluations.mockResolvedValue([
                mockEvaluation,
                mockEvaluation, // para mentor e líder
            ]);
            mockReferenceService.createReferences.mockResolvedValue(undefined);
            mockPrismaService.reference.findMany.mockResolvedValue([]);

            // Act
            const result = await service.createEvaluation(mockCreateEvaluationDto);

            // Assert
            expect(mockValidationService.validateEvaluationData).toHaveBeenCalledWith(
                mockCreateEvaluationDto,
            );
            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(mockAutoEvaluationService.createAutoEvaluation).toHaveBeenCalledWith(
                mockPrismaService,
                mockCreateEvaluationDto.autoavaliacao,
                parseInt(mockCreateEvaluationDto.colaboradorId, 10),
                mockCreateEvaluationDto.ciclo,
            );
            expect(mockPeer360EvaluationService.createPeer360Evaluations).toHaveBeenCalledWith(
                mockPrismaService,
                mockCreateEvaluationDto.avaliacao360,
                parseInt(mockCreateEvaluationDto.colaboradorId, 10),
                mockCreateEvaluationDto.ciclo,
            );
            expect(mockMentorEvaluationService.createMentorEvaluations).toHaveBeenCalledWith(
                mockPrismaService,
                mockCreateEvaluationDto.mentoring,
                parseInt(mockCreateEvaluationDto.colaboradorId, 10),
                mockCreateEvaluationDto.ciclo,
            );
            expect(mockReferenceService.createReferences).toHaveBeenCalledWith(
                mockPrismaService,
                mockCreateEvaluationDto.referencias,
                parseInt(mockCreateEvaluationDto.colaboradorId, 10),
            );
            expect(result).toBeDefined();
        });

        it('should handle empty arrays gracefully', async () => {
            // Arrange
            const emptyDto = {
                ...mockCreateEvaluationDto,
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            };

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                return await callback(mockPrismaService);
            });
            mockPrismaService.$transaction = mockTransaction;

            mockAutoEvaluationService.createAutoEvaluation.mockResolvedValue(null);
            mockPeer360EvaluationService.createPeer360Evaluations.mockResolvedValue([]);
            mockMentorEvaluationService.createMentorEvaluations.mockResolvedValue([]);
            mockReferenceService.createReferences.mockResolvedValue(undefined);
            mockPrismaService.reference.findMany.mockResolvedValue([]);

            // Act
            const result = await service.createEvaluation(emptyDto);

            // Assert
            expect(mockPeer360EvaluationService.createPeer360Evaluations).toHaveBeenCalledWith(
                mockPrismaService,
                [],
                parseInt(emptyDto.colaboradorId, 10),
                emptyDto.ciclo,
            );
            expect(mockMentorEvaluationService.createMentorEvaluations).toHaveBeenCalledWith(
                mockPrismaService,
                [],
                parseInt(emptyDto.colaboradorId, 10),
                emptyDto.ciclo,
            );
            expect(mockReferenceService.createReferences).toHaveBeenCalledWith(
                mockPrismaService,
                [],
                parseInt(emptyDto.colaboradorId, 10),
            );
            expect(result).toBeDefined();
        });
    });

    describe('findAll', () => {
        it('should return all evaluations with complete data', async () => {
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
    });

    describe('findOne', () => {
        it('should return a single evaluation by id', async () => {
            // Arrange
            const evaluationId = 1;
            mockPrismaService.evaluation.findUnique.mockResolvedValue(mockEvaluation);

            // Act
            const result = await service.findOne(evaluationId);

            // Assert
            expect(mockPrismaService.evaluation.findUnique).toHaveBeenCalledWith({
                where: { id: evaluationId },
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
            const evaluationId = 999;
            mockPrismaService.evaluation.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findOne(evaluationId)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(evaluationId)).rejects.toThrow(
                `Avaliação com ID ${evaluationId} não encontrada`,
            );
        });
    });
});
