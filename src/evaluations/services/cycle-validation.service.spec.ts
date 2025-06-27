import { Test, TestingModule } from '@nestjs/testing';
import { CycleValidationService } from './cycle-validation.service';
import { BadRequestException } from '@nestjs/common';

describe('CycleValidationService', () => {
    let service: CycleValidationService;
    let mockPrismaService: any;

    const mockActiveCycle = {
        id: 20241,
        name: '2024-Q1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
    };

    beforeEach(async () => {
        mockPrismaService = {
            cycleConfig: {
                findFirst: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [CycleValidationService],
        }).compile();

        service = module.get<CycleValidationService>(CycleValidationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateActiveCycle', () => {
        it('should validate active cycle successfully', async () => {
            // Arrange
            const futureCycle = {
                ...mockActiveCycle,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-12-31'), // Data futura
            };
            mockPrismaService.cycleConfig.findFirst.mockResolvedValue(futureCycle);

            // Act
            await service.validateActiveCycle(mockPrismaService, 'AUTOEVALUATION');

            // Assert
            expect(mockPrismaService.cycleConfig.findFirst).toHaveBeenCalledWith({
                where: { isActive: true },
            });
        });

        it('should throw error if no active cycle found', async () => {
            // Arrange
            mockPrismaService.cycleConfig.findFirst.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.validateActiveCycle(mockPrismaService, 'AUTOEVALUATION'),
            ).rejects.toThrow(new BadRequestException('Não há ciclo ativo configurado'));
        });

        it('should throw error if cycle has expired', async () => {
            // Arrange
            const expiredCycle = {
                ...mockActiveCycle,
                endDate: new Date('2023-12-30'), // Data passada
            };
            mockPrismaService.cycleConfig.findFirst.mockResolvedValue(expiredCycle);

            // Act & Assert
            await expect(
                service.validateActiveCycle(mockPrismaService, 'AUTOEVALUATION'),
            ).rejects.toThrow(
                new BadRequestException(
                    'O ciclo 2024-Q1 expirou em 30/12/2023. Não é possível criar avaliações do tipo AUTOEVALUATION.',
                ),
            );
        });

        it('should throw error if cycle not started', async () => {
            // Arrange
            const futureCycle = {
                ...mockActiveCycle,
                startDate: new Date('2025-01-01'), // Data futura
                endDate: new Date('2025-12-31'), // Data futura também
            };
            mockPrismaService.cycleConfig.findFirst.mockResolvedValue(futureCycle);

            // Act & Assert
            await expect(
                service.validateActiveCycle(mockPrismaService, 'AUTOEVALUATION'),
            ).rejects.toThrow(
                new BadRequestException(
                    'O ciclo 2024-Q1 ainda não começou. Não é possível criar avaliações do tipo AUTOEVALUATION.',
                ),
            );
        });
    });
});
