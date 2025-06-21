import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsService } from './evaluations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { Evaluation360Service } from './services/evaluation360.service';
import { MentoringService } from './services/mentoring.service';
import { ReferenceService } from './services/reference.service';
import { NotFoundException } from '@nestjs/common';

describe('EvaluationsService', () => {
    let service: EvaluationsService;
    let mockPrismaService: any;
    let mockValidationService: any;
    let mockAutoEvaluationService: any;
    let mockEvaluation360Service: any;
    let mockMentoringService: any;
    let mockReferenceService: any;

    const mockEvaluation = {
        id: 1,
        cycle: '2024-Q1',
        userId: 1,
        grade: 0,
        createdAt: new Date(),
    };

    const mockCompleteEvaluation = {
        ...mockEvaluation,
        user: { id: 1, name: 'Test User', email: 'test@test.com' },
        autoEvaluation: {
            id: 1,
            evaluationId: 1,
            justification: 'Autoavaliação geral do período',
            criteriaAssignments: [
                {
                    criterion: {
                        id: 1,
                        name: 'Domínio Técnico',
                        pillar: { id: 1, name: 'Técnico' },
                    },
                    note: 8,
                    justification: 'Bom domínio técnico',
                },
            ],
        },
        evaluation360: [],
        mentoring: [],
        references: [],
    };

    const mockCreateEvaluationDto: CreateEvaluationDto = {
        ciclo: '2024-Q1',
        colaboradorId: 1,
        autoavaliacao: {
            justificativa: 'Autoavaliação geral do período',
            pilares: [
                {
                    pilarId: 1,
                    criterios: [
                        {
                            criterioId: 1,
                            nota: 8,
                            justificativa: 'Bom domínio técnico',
                        },
                    ],
                },
            ],
        },
        avaliacao360: [
            {
                avaliadoId: 2,
                pontosFortes: 'Ótima comunicação',
                pontosMelhoria: 'Precisa melhorar prazos',
                justificativa: 'Avaliação baseada no trabalho em equipe',
            },
        ],
        mentoring: [
            {
                mentorId: 2,
                justificativa: 'Acompanhamento semanal',
            },
        ],
        referencias: [
            {
                colaboradorId: 2,
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
            $transaction: jest.fn(),
        };

        mockValidationService = {
            validateEvaluationData: jest.fn(),
        };

        mockAutoEvaluationService = {
            createAutoEvaluation: jest.fn(),
            getAutoEvaluationWithCriteria: jest.fn(),
        };

        mockEvaluation360Service = {
            createEvaluation360: jest.fn(),
            getEvaluation360ByEvaluationId: jest.fn(),
        };

        mockMentoringService = {
            createMentoring: jest.fn(),
            getMentoringByEvaluationId: jest.fn(),
        };

        mockReferenceService = {
            createReferences: jest.fn(),
            getReferencesByEvaluationId: jest.fn(),
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
                    provide: Evaluation360Service,
                    useValue: mockEvaluation360Service,
                },
                {
                    provide: MentoringService,
                    useValue: mockMentoringService,
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
            (mockPrismaService.evaluation.create as jest.Mock).mockResolvedValue(mockEvaluation);
            (mockPrismaService.evaluation.findUnique as jest.Mock).mockResolvedValue(
                mockCompleteEvaluation,
            );

            // Act
            const result = await service.createEvaluation(mockCreateEvaluationDto);

            // Assert
            expect(mockValidationService.validateEvaluationData).toHaveBeenCalledWith(
                mockCreateEvaluationDto,
            );
            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(mockPrismaService.evaluation.create).toHaveBeenCalledWith({
                data: {
                    cycle: '2024-Q1',
                    userId: 1,
                    grade: 0.0,
                },
            });
            expect(mockAutoEvaluationService.createAutoEvaluation).toHaveBeenCalledWith(
                1,
                mockCreateEvaluationDto.autoavaliacao,
                mockPrismaService,
            );
            expect(mockEvaluation360Service.createEvaluation360).toHaveBeenCalledWith(
                1,
                1,
                mockCreateEvaluationDto.avaliacao360,
                mockPrismaService,
            );
            expect(mockMentoringService.createMentoring).toHaveBeenCalledWith(
                1,
                1,
                '2024-Q1',
                mockCreateEvaluationDto.mentoring,
                mockPrismaService,
            );
            expect(mockReferenceService.createReferences).toHaveBeenCalledWith(
                1,
                1,
                mockCreateEvaluationDto.referencias,
                mockPrismaService,
            );
            expect(result).toEqual(mockCompleteEvaluation);
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
            (mockPrismaService.evaluation.create as jest.Mock).mockResolvedValue(mockEvaluation);
            (mockPrismaService.evaluation.findUnique as jest.Mock).mockResolvedValue(
                mockCompleteEvaluation,
            );

            // Act
            const result = await service.createEvaluation(emptyDto);

            // Assert
            expect(mockEvaluation360Service.createEvaluation360).not.toHaveBeenCalled();
            expect(mockMentoringService.createMentoring).not.toHaveBeenCalled();
            expect(mockReferenceService.createReferences).not.toHaveBeenCalled();
            expect(result).toEqual(mockCompleteEvaluation);
        });
    });

    describe('findAll', () => {
        it('should return all evaluations with complete data', async () => {
            // Arrange
            const mockEvaluations = [mockCompleteEvaluation];
            (mockPrismaService.evaluation.findMany as jest.Mock).mockResolvedValue(mockEvaluations);

            // Act
            const result = await service.findAll();

            // Assert
            expect(mockPrismaService.evaluation.findMany).toHaveBeenCalledWith({
                include: {
                    user: true,
                    autoEvaluation: {
                        include: {
                            criteriaAssignments: {
                                include: {
                                    criterion: {
                                        include: {
                                            pillar: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    evaluation360: true,
                    mentoring: true,
                    references: {
                        include: {
                            tagReferences: {
                                include: {
                                    tag: true,
                                },
                            },
                        },
                    },
                },
            });
            expect(result).toEqual(mockEvaluations);
        });

        it('should return empty array when no evaluations exist', async () => {
            // Arrange
            (mockPrismaService.evaluation.findMany as jest.Mock).mockResolvedValue([]);

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
            (mockPrismaService.evaluation.findUnique as jest.Mock).mockResolvedValue(
                mockCompleteEvaluation,
            );

            // Act
            const result = await service.findOne(evaluationId);

            // Assert
            expect(mockPrismaService.evaluation.findUnique).toHaveBeenCalledWith({
                where: { id: evaluationId },
                include: {
                    user: true,
                    autoEvaluation: {
                        include: {
                            criteriaAssignments: {
                                include: {
                                    criterion: {
                                        include: {
                                            pillar: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    evaluation360: true,
                    mentoring: true,
                    references: {
                        include: {
                            tagReferences: {
                                include: {
                                    tag: true,
                                },
                            },
                        },
                    },
                },
            });
            expect(result).toEqual(mockCompleteEvaluation);
        });

        it('should throw NotFoundException when evaluation not found', async () => {
            // Arrange
            const evaluationId = 999;
            (mockPrismaService.evaluation.findUnique as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(service.findOne(evaluationId)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(evaluationId)).rejects.toThrow(
                `Avaliação com ID ${evaluationId} não encontrada`,
            );
        });
    });
});
