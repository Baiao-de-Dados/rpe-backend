import { Test, TestingModule } from '@nestjs/testing';
import { AutoEvaluationService } from './auto-evaluation.service';
import { CycleValidationService } from './cycle-validation.service';
import { BadRequestException } from '@nestjs/common';

describe('AutoEvaluationService', () => {
    let service: AutoEvaluationService;
    let mockPrismaService: any;
    let mockCycleValidationService: any;

    const mockAutoavaliacao = {
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
    };

    const mockUser = {
        id: 1,
        name: 'Test User',
        track: 'Backend',
        position: 'Developer',
    };

    const mockActiveCycle = {
        id: 20241,
        name: '2024-Q1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
    };

    const mockCriteria = [
        {
            id: 1,
            name: 'Técnico',
            pillarId: 1,
            isRequired: true,
        },
    ];

    const mockCriteriaConfig = [
        {
            id: 1,
            criterionId: 1,
            track: 'Backend',
            position: 'Developer',
            isAuthorized: true,
        },
    ];

    beforeEach(async () => {
        mockPrismaService = {
            user: {
                findUnique: jest.fn(),
            },
            cycleConfig: {
                findFirst: jest.fn(),
            },
            criterion: {
                findMany: jest.fn(),
            },
            criteriaConfig: {
                findMany: jest.fn(),
            },
            criterionTrackConfig: {
                findMany: jest.fn(),
            },
            evaluation: {
                findFirst: jest.fn(),
                create: jest.fn(),
            },
            criteriaAssignment: {
                create: jest.fn(),
            },
        };

        mockCycleValidationService = {
            validateActiveCycle: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AutoEvaluationService,
                {
                    provide: CycleValidationService,
                    useValue: mockCycleValidationService,
                },
            ],
        }).compile();

        service = module.get<AutoEvaluationService>(AutoEvaluationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createAutoEvaluation', () => {
        it('should create auto evaluation successfully', async () => {
            // Arrange
            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.cycleConfig.findFirst.mockResolvedValue(mockActiveCycle);
            mockPrismaService.criterion.findMany.mockResolvedValue(mockCriteria);
            mockPrismaService.criteriaConfig.findMany.mockResolvedValue(mockCriteriaConfig);
            mockPrismaService.evaluation.create.mockResolvedValue({
                id: 1,
                type: 'AUTOEVALUATION',
                evaluatorId: 1,
                evaluateeId: 1,
                cycle: 20241,
                score: 0,
            });
            mockPrismaService.criteriaAssignment.create.mockResolvedValue({
                id: 1,
                evaluationId: 1,
                criterionId: 1,
                score: 8,
                justification: 'Bom domínio técnico',
            });

            // Act
            const result = await service.createAutoEvaluation(
                mockPrismaService,
                mockAutoavaliacao,
                1,
                '2024-Q1',
                mockUser.track,
                mockUser.position,
            );

            // Assert
            expect(mockCycleValidationService.validateActiveCycle).toHaveBeenCalledWith(
                mockPrismaService,
                'AUTOEVALUATION',
            );
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toBeDefined();
        });

        it('should throw error if no active cycle', async () => {
            // Arrange
            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.cycleConfig.findFirst.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.createAutoEvaluation(
                    mockPrismaService,
                    mockAutoavaliacao,
                    1,
                    '2024-Q1',
                    mockUser.track,
                    mockUser.position,
                ),
            ).rejects.toThrow(
                new BadRequestException('Nenhum ciclo ativo encontrado para criar avaliações'),
            );
        });

        it('should throw error if criteria not authorized for user track/position', async () => {
            // Arrange
            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.cycleConfig.findFirst.mockResolvedValue(mockActiveCycle);
            mockPrismaService.criterion.findMany.mockResolvedValue(mockCriteria);
            mockPrismaService.criteriaConfig.findMany.mockResolvedValue([]);

            // Act & Assert
            await expect(
                service.createAutoEvaluation(
                    mockPrismaService,
                    mockAutoavaliacao,
                    1,
                    '2024-Q1',
                    mockUser.track,
                    mockUser.position,
                ),
            ).rejects.toThrow(
                new BadRequestException(
                    'Nenhum critério configurado para sua trilha (Backend) e cargo (Developer)',
                ),
            );
        });

        it('should throw error if not all required criteria are evaluated', async () => {
            // Arrange
            const incompleteAutoavaliacao = {
                pilares: [
                    {
                        pilarId: '1',
                        criterios: [
                            {
                                criterioId: '1',
                                nota: 8,
                                justificativa: 'Bom domínio técnico',
                            },
                            // Faltando critério obrigatório
                        ],
                    },
                ],
            };

            const mockRequiredCriteria = [
                {
                    id: 1,
                    name: 'Técnico',
                    pillarId: 1,
                    isRequired: true,
                },
                {
                    id: 2,
                    name: 'Comunicação',
                    pillarId: 1,
                    isRequired: true,
                },
            ];

            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.cycleConfig.findFirst.mockResolvedValue(mockActiveCycle);
            mockPrismaService.criterion.findMany.mockResolvedValue(mockRequiredCriteria);
            mockPrismaService.criteriaConfig.findMany.mockResolvedValue([
                {
                    id: 1,
                    criterionId: 1,
                    track: 'Backend',
                    position: 'Developer',
                    isAuthorized: true,
                },
                {
                    id: 2,
                    criterionId: 2,
                    track: 'Backend',
                    position: 'Developer',
                    isAuthorized: true,
                },
            ]);

            // Act & Assert
            await expect(
                service.createAutoEvaluation(
                    mockPrismaService,
                    incompleteAutoavaliacao,
                    1,
                    '2024-Q1',
                    mockUser.track,
                    mockUser.position,
                ),
            ).rejects.toThrow(
                new BadRequestException(
                    'Você deve avaliar todos os critérios obrigatórios para sua trilha/cargo. Critérios faltando: Comunicação',
                ),
            );
        });
    });
});
