import { Test, TestingModule } from '@nestjs/testing';
import { CriteriaService } from './criteria.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { CreateCriterionTrackConfigDto } from '../evaluations/autoevaluations/criteria/dto/create-criterion-track-config.dto';
import { UpdateCriterionTrackConfigDto } from './dto/update-criterion-track-config.dto';
import { NotFoundException } from '@nestjs/common';

describe('CriteriaService', () => {
    let service: CriteriaService;
    let mockPrismaService: any;

    const mockCriterion = {
        id: 1,
        name: 'Conhecimento Técnico',
        description: 'Domínio das tecnologias utilizadas',
        pillarId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        pillar: {
            id: 1,
            name: 'Técnico',
            description: 'Pilar técnico',
        },
    };

    const mockCriterionTrackConfig = {
        id: 1,
        criterionId: 1,
        track: 'Backend',
        position: 'Developer',
        isActive: true,
        weight: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        criterion: mockCriterion,
    };

    const mockCreateCriterionDto: CreateCriterionDto = {
        name: 'Test Criterion',
        description: 'Test Description',
        pillarId: 1,
        weight: 1.0,
    };

    const mockUpdateCriterionDto: UpdateCriterionDto = {
        name: 'Conhecimento Técnico Atualizado',
        description: 'Domínio atualizado das tecnologias',
    };

    const mockCreateCriterionTrackConfigDto: CreateCriterionTrackConfigDto = {
        criterionId: 1,
        track: 'Backend',
        position: 'Developer',
        isActive: true,
        weight: 0.5,
    };

    const mockUpdateCriterionTrackConfigDto: UpdateCriterionTrackConfigDto = {
        isActive: false,
        weight: 0.7,
    };

    beforeEach(async () => {
        mockPrismaService = {
            criterion: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            criterionTrackConfig: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CriteriaService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<CriteriaService>(CriteriaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a criterion successfully', async () => {
            // Arrange
            mockPrismaService.criterion.create.mockResolvedValue(mockCriterion);

            // Act
            const result = await service.create(mockCreateCriterionDto);

            // Assert
            expect(mockPrismaService.criterion.create).toHaveBeenCalledWith({
                data: mockCreateCriterionDto,
                include: {
                    pillar: true,
                },
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should handle database errors', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPrismaService.criterion.create.mockRejectedValue(error);

            // Act & Assert
            await expect(service.create(mockCreateCriterionDto)).rejects.toThrow(error);
        });
    });

    describe('findAll', () => {
        it('should return all criteria', async () => {
            // Arrange
            const mockCriteria = [mockCriterion];
            mockPrismaService.criterion.findMany.mockResolvedValue(mockCriteria);

            // Act
            const result = await service.findAll();

            // Assert
            expect(mockPrismaService.criterion.findMany).toHaveBeenCalledWith({
                include: {
                    pillar: true,
                },
            });
            expect(result).toEqual(mockCriteria);
        });

        it('should return empty array when no criteria exist', async () => {
            // Arrange
            mockPrismaService.criterion.findMany.mockResolvedValue([]);

            // Act
            const result = await service.findAll();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a criterion by id', async () => {
            // Arrange
            mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);

            // Act
            const result = await service.findOne(1);

            // Assert
            expect(mockPrismaService.criterion.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: {
                    pillar: true,
                },
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should throw NotFoundException when criterion not found', async () => {
            // Arrange
            mockPrismaService.criterion.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findOne(999)).rejects.toThrow(
                new NotFoundException('Critério com ID 999 não encontrado'),
            );
        });
    });

    describe('update', () => {
        it('should update a criterion successfully', async () => {
            // Arrange
            const updatedCriterion = { ...mockCriterion, ...mockUpdateCriterionDto };
            mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);
            mockPrismaService.criterion.update.mockResolvedValue(updatedCriterion);

            // Act
            const result = await service.update(1, mockUpdateCriterionDto);

            // Assert
            expect(mockPrismaService.criterion.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: mockUpdateCriterionDto,
                include: {
                    pillar: true,
                },
            });
            expect(result).toEqual(updatedCriterion);
        });

        it('should throw NotFoundException when criterion not found', async () => {
            // Arrange
            mockPrismaService.criterion.update.mockRejectedValue(
                new Error('Record to update not found'),
            );

            // Act & Assert
            await expect(service.update(999, mockUpdateCriterionDto)).rejects.toThrow();
        });
    });

    describe('remove', () => {
        it('should remove a criterion successfully', async () => {
            // Arrange
            mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);
            mockPrismaService.criterion.delete.mockResolvedValue(mockCriterion);

            // Act
            const result = await service.remove(1);

            // Assert
            expect(mockPrismaService.criterion.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should throw NotFoundException when criterion not found', async () => {
            // Arrange
            mockPrismaService.criterion.delete.mockRejectedValue(
                new Error('Record to delete does not exist'),
            );

            // Act & Assert
            await expect(service.remove(999)).rejects.toThrow();
        });
    });

    describe('createTrackConfig', () => {
        it('should create a criterion track config successfully', async () => {
            // Arrange
            mockPrismaService.criterionTrackConfig.create.mockResolvedValue(
                mockCriterionTrackConfig,
            );

            // Act
            const result = await service.createTrackConfig(mockCreateCriterionTrackConfigDto);

            // Assert
            expect(mockPrismaService.criterionTrackConfig.create).toHaveBeenCalledWith({
                data: mockCreateCriterionTrackConfigDto,
                include: {
                    criterion: {
                        include: {
                            pillar: true,
                        },
                    },
                },
            });
            expect(result).toEqual(mockCriterionTrackConfig);
        });

        it('should handle database errors', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPrismaService.criterionTrackConfig.create.mockRejectedValue(error);

            // Act & Assert
            await expect(
                service.createTrackConfig(mockCreateCriterionTrackConfigDto),
            ).rejects.toThrow(error);
        });
    });

    describe('findAllTrackConfigs', () => {
        it('should return all criterion track configs', async () => {
            // Arrange
            const mockConfigs = [mockCriterionTrackConfig];
            mockPrismaService.criterionTrackConfig.findMany.mockResolvedValue(mockConfigs);

            // Act
            const result = await service.findAllTrackConfigs();

            // Assert
            expect(mockPrismaService.criterionTrackConfig.findMany).toHaveBeenCalledWith({
                include: {
                    criterion: {
                        include: {
                            pillar: true,
                        },
                    },
                },
            });
            expect(result).toEqual(mockConfigs);
        });

        it('should filter by track and position when provided', async () => {
            // Arrange
            const mockConfigs = [mockCriterionTrackConfig];
            mockPrismaService.criterionTrackConfig.findMany.mockResolvedValue(mockConfigs);

            // Act
            const result = await service.findTrackConfigsByTrackAndPosition('Backend', 'Developer');

            // Assert
            expect(mockPrismaService.criterionTrackConfig.findMany).toHaveBeenCalledWith({
                where: {
                    track: 'Backend',
                    position: 'Developer',
                    isActive: true,
                },
                include: {
                    criterion: {
                        include: {
                            pillar: true,
                        },
                    },
                },
            });
            expect(result).toEqual(mockConfigs);
        });
    });

    describe('updateTrackConfig', () => {
        it('should update a criterion track config successfully', async () => {
            // Arrange
            const updatedConfig = {
                ...mockCriterionTrackConfig,
                ...mockUpdateCriterionTrackConfigDto,
            };
            mockPrismaService.criterionTrackConfig.findUnique.mockResolvedValue(
                mockCriterionTrackConfig,
            );
            mockPrismaService.criterionTrackConfig.update.mockResolvedValue(updatedConfig);

            // Act
            const result = await service.updateTrackConfig(
                1,
                'Backend',
                'Developer',
                mockUpdateCriterionTrackConfigDto,
            );

            // Assert
            expect(mockPrismaService.criterionTrackConfig.update).toHaveBeenCalledWith({
                where: {
                    criterionId_track_position: {
                        criterionId: 1,
                        track: 'Backend',
                        position: 'Developer',
                    },
                },
                data: mockUpdateCriterionTrackConfigDto,
                include: {
                    criterion: {
                        include: {
                            pillar: true,
                        },
                    },
                },
            });
            expect(result).toEqual(updatedConfig);
        });

        it('should throw NotFoundException when config not found', async () => {
            // Arrange
            mockPrismaService.criterionTrackConfig.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.updateTrackConfig(
                    999,
                    'Backend',
                    'Developer',
                    mockUpdateCriterionTrackConfigDto,
                ),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('removeTrackConfig', () => {
        it('should remove a criterion track config successfully', async () => {
            // Arrange
            mockPrismaService.criterionTrackConfig.findUnique.mockResolvedValue(
                mockCriterionTrackConfig,
            );
            mockPrismaService.criterionTrackConfig.delete.mockResolvedValue(
                mockCriterionTrackConfig,
            );

            // Act
            const result = await service.removeTrackConfig(1, 'Backend', 'Developer');

            // Assert
            expect(mockPrismaService.criterionTrackConfig.delete).toHaveBeenCalledWith({
                where: {
                    criterionId_track_position: {
                        criterionId: 1,
                        track: 'Backend',
                        position: 'Developer',
                    },
                },
            });
            expect(result).toEqual(mockCriterionTrackConfig);
        });

        it('should throw NotFoundException when config not found', async () => {
            // Arrange
            mockPrismaService.criterionTrackConfig.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.removeTrackConfig(999, 'Backend', 'Developer')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
