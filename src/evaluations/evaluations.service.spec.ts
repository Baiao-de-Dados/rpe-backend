import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsService } from './evaluations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { NotFoundException } from '@nestjs/common';

describe('EvaluationsService', () => {
    let service: EvaluationsService;

    const mockPrismaService = {
        evaluation: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        autoEvaluation: {
            create: jest.fn(),
        },
        evaluation360: {
            create: jest.fn(),
        },
        mentoring: {
            create: jest.fn(),
        },
        reference: {
            create: jest.fn(),
        },
    };

    const mockCreateEvaluationDto: CreateEvaluationDto = {
        ciclo: '2024-Q1',
        colaboradorId: 1,
        autoavaliacao: {
            pilares: [
                {
                    pilarId: 1,
                    criterios: [
                        {
                            criterioId: 1,
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

    const mockEvaluation = {
        id: 1,
        period: '2024-Q1',
        userId: 1,
        createdAt: new Date(),
        grade: null,
    };

    const mockCompleteEvaluation = {
        ...mockEvaluation,
        user: { id: 1, email: 'test@test.com', name: 'Test User' },
        autoEvaluation: {
            id: 1,
            evaluationId: 1,
            criteriaAssignments: [
                {
                    criterion: { id: 1, name: 'Conhecimento Técnico' },
                },
            ],
        },
        evaluation360: [
            {
                id: 1,
                evaluationId: 1,
                evaluatorId: 1,
                evaluatedId: 2,
                strengths: 'Ótima comunicação',
                improvements: 'Precisa melhorar prazos',
            },
        ],
        mentoring: [
            {
                id: 1,
                evaluationId: 1,
                evaluatorId: 2,
                evaluatedId: 1,
                justification: 'Acompanhamento semanal',
            },
        ],
        references: [
            {
                id: 1,
                evaluationId: 1,
                evaluatorId: 1,
                evaluatedId: 2,
                justification: 'Referência técnica',
                tagReferences: [{ tag: { id: 1, name: 'Desenvolvedor' } }],
            },
        ],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EvaluationsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
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
            mockPrismaService.evaluation.create.mockResolvedValue(mockEvaluation);
            mockPrismaService.autoEvaluation.create.mockResolvedValue({});
            mockPrismaService.evaluation360.create.mockResolvedValue({});
            mockPrismaService.mentoring.create.mockResolvedValue({});
            mockPrismaService.reference.create.mockResolvedValue({});
            mockPrismaService.evaluation.findUnique.mockResolvedValue(mockCompleteEvaluation);

            // Act
            const result = await service.createEvaluation(mockCreateEvaluationDto);

            // Assert
            expect(mockPrismaService.evaluation.create).toHaveBeenCalledWith({
                data: {
                    period: '2024-Q1',
                    userId: 1,
                },
            });

            expect(mockPrismaService.autoEvaluation.create).toHaveBeenCalledWith({
                data: {
                    evaluationId: 1,
                    criteriaAssignments: {
                        create: [
                            {
                                criterion: { connect: { id: 1 } },
                            },
                        ],
                    },
                },
            });

            expect(mockPrismaService.evaluation360.create).toHaveBeenCalledWith({
                data: {
                    evaluationId: 1,
                    evaluatorId: 1,
                    evaluatedId: 2,
                    strengths: 'Ótima comunicação',
                    improvements: 'Precisa melhorar prazos',
                },
            });

            expect(mockPrismaService.mentoring.create).toHaveBeenCalledWith({
                data: {
                    evaluationId: 1,
                    evaluatorId: 2,
                    evaluatedId: 1,
                    justification: 'Acompanhamento semanal',
                },
            });

            expect(mockPrismaService.reference.create).toHaveBeenCalledWith({
                data: {
                    evaluationId: 1,
                    evaluatorId: 1,
                    evaluatedId: 2,
                    justification: 'Referência técnica',
                    cycle: '2024-Q1',
                    tagReferences: {
                        create: [{ tag: { connect: { id: 1 } } }],
                    },
                },
            });

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

            mockPrismaService.evaluation.create.mockResolvedValue(mockEvaluation);
            mockPrismaService.autoEvaluation.create.mockResolvedValue({});
            mockPrismaService.evaluation.findUnique.mockResolvedValue(mockCompleteEvaluation);

            // Act
            const result = await service.createEvaluation(emptyDto);

            // Assert
            expect(mockPrismaService.evaluation360.create).not.toHaveBeenCalled();
            expect(mockPrismaService.mentoring.create).not.toHaveBeenCalled();
            expect(mockPrismaService.reference.create).not.toHaveBeenCalled();
            expect(result).toEqual(mockCompleteEvaluation);
        });
    });

    describe('findAll', () => {
        it('should return all evaluations with complete data', async () => {
            // Arrange
            const mockEvaluations = [mockCompleteEvaluation];
            mockPrismaService.evaluation.findMany.mockResolvedValue(mockEvaluations);

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
                                    criterion: true,
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
            mockPrismaService.evaluation.findUnique.mockResolvedValue(mockCompleteEvaluation);

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
                                    criterion: true,
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
            mockPrismaService.evaluation.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findOne(evaluationId)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(evaluationId)).rejects.toThrow(
                `Avaliação com ID ${evaluationId} não encontrada`,
            );
        });
    });
});
