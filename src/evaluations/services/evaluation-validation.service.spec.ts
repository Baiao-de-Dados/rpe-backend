import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationValidationService } from './evaluation-validation.service';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

describe('EvaluationValidationService', () => {
    let service: EvaluationValidationService;
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
        avaliacao360: [
            {
                avaliadoId: '2',
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
                tagIds: [1, 2],
            },
        ],
    };

    beforeEach(async () => {
        mockPrismaService = {
            user: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            criterion: {
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EvaluationValidationService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<EvaluationValidationService>(EvaluationValidationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateEvaluationData', () => {
        it('should validate evaluation data successfully', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, name: 'User 1' });
            mockPrismaService.user.findMany
                .mockResolvedValueOnce([{ id: 2, name: 'User 2' }]) // avaliadoIds
                .mockResolvedValueOnce([{ id: 3, name: 'User 3' }]) // mentorIds
                .mockResolvedValueOnce([{ id: 4, name: 'User 4' }]) // leaderIds
                .mockResolvedValueOnce([{ id: 2, name: 'User 2' }]); // referenciaIds
            mockPrismaService.criterion.findMany.mockResolvedValue([
                { id: 1, name: 'Criterion 1' },
            ]);

            // Act
            await service.validateEvaluationData(mockCreateEvaluationDto);

            // Assert
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should throw error if colaborador is not found', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.validateEvaluationData(mockCreateEvaluationDto)).rejects.toThrow(
                new NotFoundException('Colaborador com ID 1 não encontrado'),
            );
        });

        it('should throw error if ciclo is missing', () => {
            // Arrange
            const invalidDto = { ...mockCreateEvaluationDto, ciclo: undefined } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Ciclo é obrigatório'),
            );
        });

        it('should throw error if colaboradorId is missing', () => {
            // Arrange
            const invalidDto = { ...mockCreateEvaluationDto, colaboradorId: undefined } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('ID do colaborador é obrigatório'),
            );
        });

        it('should throw error if autoavaliacao pilares is missing', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                autoavaliacao: { pilares: undefined },
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Pilares são obrigatórios na autoavaliação'),
            );
        });

        it('should throw error if autoavaliacao criterios is missing', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                autoavaliacao: {
                    pilares: [{ pilarId: '1', criterios: undefined }],
                },
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Critérios são obrigatórios no pilar'),
            );
        });

        it('should throw error if criterioId is missing', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [{ nota: 8, justificativa: 'Test' }],
                        },
                    ],
                },
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('ID do critério é obrigatório'),
            );
        });

        it('should throw error if nota is missing', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [{ criterioId: '1', justificativa: 'Test' }],
                        },
                    ],
                },
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Nota é obrigatória no critério'),
            );
        });

        it('should throw error if justificativa is missing in criterio', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [{ criterioId: '1', nota: 8 }],
                        },
                    ],
                },
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Justificativa é obrigatória no critério'),
            );
        });

        it('should throw error if avaliadoId is missing in avaliacao360', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                avaliacao360: [{ justificativa: 'Test' }],
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('ID do avaliado é obrigatório na avaliação 360'),
            );
        });

        it('should throw error if justificativa is missing in avaliacao360', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                avaliacao360: [{ avaliadoId: '2' }],
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Justificativa é obrigatória na avaliação 360'),
            );
        });

        it('should throw error if colaboradorId is missing in referencias', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                referencias: [{ justificativa: 'Test', tagIds: [1] }],
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('ID do colaborador é obrigatório na referência'),
            );
        });

        it('should throw error if justificativa is missing in referencias', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                referencias: [{ colaboradorId: '2', tagIds: [1] }],
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Justificativa é obrigatória na referência'),
            );
        });

        it('should throw error if tagIds is missing in referencias', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                referencias: [{ colaboradorId: '2', justificativa: 'Test' }],
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Tags são obrigatórias na referência'),
            );
        });

        it('should throw error if tagIds is empty in referencias', () => {
            // Arrange
            const invalidDto = {
                ...mockCreateEvaluationDto,
                referencias: [{ colaboradorId: '2', justificativa: 'Test', tagIds: [] }],
            } as any;

            // Act & Assert
            expect(() => service.validateEvaluationData(invalidDto)).toThrow(
                new BadRequestException('Tags não podem estar vazias'),
            );
        });
    });
});
