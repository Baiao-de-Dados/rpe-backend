import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

describe('EvaluationsController', () => {
    let controller: EvaluationsController;

    const mockEvaluationsService = {
        createEvaluation: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    const mockPrismaService = {
        user: {
            findMany: jest.fn(),
        },
        evaluation: {
            findMany: jest.fn(),
        },
    };

    const mockCreateEvaluationDto = {
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

    const mockEvaluation = {
        id: 1,
        cycle: '2024-Q1',
        userId: 1,
        createdAt: new Date(),
        grade: 0,
        user: { id: 1, email: 'test@test.com', name: 'Test User' },
        autoEvaluation: {
            id: 1,
            evaluationId: 1,
            criteriaAssignments: [
                {
                    criterion: { id: 1, name: 'Conhecimento Técnico' },
                    justification: 'Tenho bom domínio das tecnologias',
                    nota: 8.0,
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
        leader: {
            id: 2,
            evaluationId: 2,
            evaluatorId: 3,
            evaluatedId: 1,
            justification: 'Avaliação do líder',
            cycle: '2024-Q1',
        },
        mentoring: {
            id: 3,
            evaluationId: 3,
            evaluatorId: 4,
            evaluatedId: 1,
            justification: 'Acompanhamento semanal',
            cycle: '2024-Q1',
        },
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
            ],
        }).compile();

        controller = module.get<EvaluationsController>(EvaluationsController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new evaluation', async () => {
            // Arrange
            mockEvaluationsService.createEvaluation.mockResolvedValue(mockEvaluation);

            // Act
            const result = await controller.create(mockCreateEvaluationDto);

            // Assert
            expect(mockEvaluationsService.createEvaluation).toHaveBeenCalledWith(
                mockCreateEvaluationDto,
            );
            expect(result).toEqual(mockEvaluation);
        });

        it('should handle service errors properly', async () => {
            // Arrange
            const error = new Error('Database error');
            mockEvaluationsService.createEvaluation.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.create(mockCreateEvaluationDto)).rejects.toThrow(error);
            expect(mockEvaluationsService.createEvaluation).toHaveBeenCalledWith(
                mockCreateEvaluationDto,
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
            expect(mockEvaluationsService.findAll).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a single evaluation by id', async () => {
            // Arrange
            const evaluationId = 1;
            mockEvaluationsService.findOne.mockResolvedValue(mockEvaluation);

            // Act
            const result = await controller.findOne(evaluationId);

            // Assert
            expect(mockEvaluationsService.findOne).toHaveBeenCalledWith(evaluationId);
            expect(result).toEqual(mockEvaluation);
        });

        it('should handle NotFoundException properly', async () => {
            // Arrange
            const evaluationId = 999;
            mockEvaluationsService.findOne.mockRejectedValue(new NotFoundException());

            // Act & Assert
            await expect(controller.findOne(evaluationId)).rejects.toThrow(NotFoundException);
            expect(mockEvaluationsService.findOne).toHaveBeenCalledWith(evaluationId);
        });

        it('should handle other service errors properly', async () => {
            // Arrange
            const evaluationId = 1;
            const error = new Error('Database error');
            mockEvaluationsService.findOne.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.findOne(evaluationId)).rejects.toThrow(error);
            expect(mockEvaluationsService.findOne).toHaveBeenCalledWith(evaluationId);
        });
    });
});
