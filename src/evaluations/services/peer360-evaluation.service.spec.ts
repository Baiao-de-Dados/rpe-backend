import { Test, TestingModule } from '@nestjs/testing';
import { Peer360EvaluationService } from './peer360-evaluation.service';
import { CycleValidationService } from './cycle-validation.service';
import { BadRequestException } from '@nestjs/common';

describe('Peer360EvaluationService', () => {
    let service: Peer360EvaluationService;
    let mockPrismaService: any;
    let mockCycleValidationService: any;

    const mockAvaliacao360 = [
        {
            avaliadoId: '2',
            justificativa: 'Avaliação baseada no trabalho em equipe',
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
                Peer360EvaluationService,
                {
                    provide: CycleValidationService,
                    useValue: mockCycleValidationService,
                },
            ],
        }).compile();

        service = module.get<Peer360EvaluationService>(Peer360EvaluationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createPeer360Evaluations', () => {
        it('should create peer 360 evaluations successfully', async () => {
            // Arrange
            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.evaluation.create.mockResolvedValue({
                id: 1,
                type: 'PEER_360',
                evaluatorId: 1,
                evaluateeId: 2,
                cycle: 20241,
                justification: 'Avaliação baseada no trabalho em equipe',
                score: 0,
            });

            // Act
            const result = await service.createPeer360Evaluations(
                mockPrismaService,
                mockAvaliacao360,
                1,
                '2024-Q1',
            );

            // Assert
            expect(mockCycleValidationService.validateActiveCycle).toHaveBeenCalledWith(
                mockPrismaService,
                'PEER_360',
            );
            expect(mockPrismaService.evaluation.create).toHaveBeenCalledWith({
                data: {
                    type: 'PEER_360',
                    evaluatorId: 1,
                    evaluateeId: 2,
                    cycle: 20241,
                    justification: 'Avaliação baseada no trabalho em equipe',
                    score: 0,
                },
            });
            expect(result).toHaveLength(1);
        });

        it('should throw error if avaliadoId is missing', async () => {
            // Arrange
            const invalidAvaliacao360 = [
                {
                    justificativa: 'Avaliação baseada no trabalho em equipe',
                    // avaliadoId missing
                },
            ];

            // Act & Assert
            await expect(
                service.createPeer360Evaluations(
                    mockPrismaService,
                    invalidAvaliacao360,
                    1,
                    '2024-Q1',
                ),
            ).rejects.toThrow(new BadRequestException('ID do avaliado é obrigatório'));
        });

        it('should throw error if justificativa is missing', async () => {
            // Arrange
            const invalidAvaliacao360 = [
                {
                    avaliadoId: '2',
                    // justificativa missing
                },
            ];

            // Act & Assert
            await expect(
                service.createPeer360Evaluations(
                    mockPrismaService,
                    invalidAvaliacao360,
                    1,
                    '2024-Q1',
                ),
            ).rejects.toThrow(new BadRequestException('Justificativa é obrigatória'));
        });

        it('should handle empty array', async () => {
            // Act & Assert
            await expect(
                service.createPeer360Evaluations(mockPrismaService, [], 1, '2024-Q1'),
            ).rejects.toThrow(new BadRequestException('Avaliações 360 são obrigatórias'));
        });

        it('should handle database errors', async () => {
            // Arrange
            const error = new Error('Database error');
            mockCycleValidationService.validateActiveCycle.mockResolvedValue(undefined);
            mockPrismaService.evaluation.create.mockRejectedValue(error);

            // Act & Assert
            await expect(
                service.createPeer360Evaluations(mockPrismaService, mockAvaliacao360, 1, '2024-Q1'),
            ).rejects.toThrow(error);
        });
    });
});
