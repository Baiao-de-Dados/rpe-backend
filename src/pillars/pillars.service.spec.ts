import { Test, TestingModule } from '@nestjs/testing';
import { PillarsService } from './pillars.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';
import { CreatePillarTrackConfigDto } from './dto/create-pillar-track-config.dto';
import { UpdatePillarTrackConfigDto } from './dto/update-pillar-track-config.dto';
import { NotFoundException } from '@nestjs/common';

describe('PillarsService', () => {
    let service: PillarsService;
    let mockPrismaService: any;

    const mockPillar = {
        id: 1,
        name: 'Técnico',
        description: 'Pilar técnico',
        createdAt: new Date(),
        updatedAt: new Date(),
        criteria: [],
    };

    const mockPillarTrackConfig = {
        id: 1,
        pillarId: 1,
        track: 'Backend',
        position: 'Developer',
        isActive: true,
        weight: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        pillar: mockPillar,
    };

    const mockCreatePillarDto: CreatePillarDto = {
        name: 'Técnico',
        description: 'Pilar técnico',
    };

    const mockUpdatePillarDto: UpdatePillarDto = {
        name: 'Técnico Atualizado',
        description: 'Pilar técnico atualizado',
    };

    const mockCreatePillarTrackConfigDto: CreatePillarTrackConfigDto = {
        pillarId: 1,
        track: 'Backend',
        position: 'Developer',
        isActive: true,
    };

    const mockUpdatePillarTrackConfigDto: UpdatePillarTrackConfigDto = {
        isActive: false,
    };

    beforeEach(async () => {
        mockPrismaService = {
            pillar: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            pillarTrackConfig: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PillarsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<PillarsService>(PillarsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a pillar successfully', async () => {
            // Arrange
            mockPrismaService.pillar.create.mockResolvedValue(mockPillar);

            // Act
            const result = await service.create(mockCreatePillarDto);

            // Assert
            expect(mockPrismaService.pillar.create).toHaveBeenCalledWith({
                data: mockCreatePillarDto,
                include: {
                    criteria: true,
                },
            });
            expect(result).toEqual(mockPillar);
        });

        it('should handle database errors', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPrismaService.pillar.create.mockRejectedValue(error);

            // Act & Assert
            await expect(service.create(mockCreatePillarDto)).rejects.toThrow(error);
        });
    });

    describe('findAll', () => {
        it('should return all pillars', async () => {
            // Arrange
            const mockPillars = [mockPillar];
            mockPrismaService.pillar.findMany.mockResolvedValue(mockPillars);

            // Act
            const result = await service.findAll();

            // Assert
            expect(mockPrismaService.pillar.findMany).toHaveBeenCalledWith({
                include: {
                    criteria: true,
                },
            });
            expect(result).toEqual(mockPillars);
        });

        it('should return empty array when no pillars exist', async () => {
            // Arrange
            mockPrismaService.pillar.findMany.mockResolvedValue([]);

            // Act
            const result = await service.findAll();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a pillar by id', async () => {
            // Arrange
            mockPrismaService.pillar.findUnique.mockResolvedValue(mockPillar);

            // Act
            const result = await service.findOne(1);

            // Assert
            expect(mockPrismaService.pillar.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: {
                    criteria: true,
                },
            });
            expect(result).toEqual(mockPillar);
        });

        it('should throw NotFoundException when pillar not found', async () => {
            // Arrange
            mockPrismaService.pillar.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findOne(999)).rejects.toThrow(
                new NotFoundException('Pilar com ID 999 não encontrado'),
            );
        });
    });

    describe('update', () => {
        it('should update a pillar successfully', async () => {
            // Arrange
            const updatedPillar = { ...mockPillar, ...mockUpdatePillarDto };
            mockPrismaService.pillar.findUnique.mockResolvedValue(mockPillar);
            mockPrismaService.pillar.update.mockResolvedValue(updatedPillar);

            // Act
            const result = await service.update(1, mockUpdatePillarDto);

            // Assert
            expect(mockPrismaService.pillar.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: mockUpdatePillarDto,
                include: {
                    criteria: true,
                },
            });
            expect(result).toEqual(updatedPillar);
        });

        it('should throw NotFoundException when pillar not found', async () => {
            // Arrange
            mockPrismaService.pillar.update.mockRejectedValue(
                new Error('Record to update not found'),
            );

            // Act & Assert
            await expect(service.update(999, mockUpdatePillarDto)).rejects.toThrow();
        });
    });

    describe('remove', () => {
        it('should remove a pillar successfully', async () => {
            // Arrange
            mockPrismaService.pillar.findUnique.mockResolvedValue(mockPillar);
            mockPrismaService.pillar.delete.mockResolvedValue(mockPillar);

            // Act
            const result = await service.remove(1);

            // Assert
            expect(mockPrismaService.pillar.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toEqual(mockPillar);
        });

        it('should throw NotFoundException when pillar not found', async () => {
            // Arrange
            mockPrismaService.pillar.delete.mockRejectedValue(
                new Error('Record to delete does not exist'),
            );

            // Act & Assert
            await expect(service.remove(999)).rejects.toThrow();
        });
    });

    describe('createTrackConfig', () => {
        it('should create a pillar track config successfully', async () => {
            // Arrange
            mockPrismaService.pillarTrackConfig.create.mockResolvedValue(mockPillarTrackConfig);

            // Act
            const result = await service.createTrackConfig(mockCreatePillarTrackConfigDto);

            // Assert
            expect(mockPrismaService.pillarTrackConfig.create).toHaveBeenCalledWith({
                data: mockCreatePillarTrackConfigDto,
                include: {
                    pillar: {
                        include: {
                            criteria: true,
                        },
                    },
                },
            });
            expect(result).toEqual(mockPillarTrackConfig);
        });

        it('should handle database errors', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPrismaService.pillarTrackConfig.create.mockRejectedValue(error);

            // Act & Assert
            await expect(service.createTrackConfig(mockCreatePillarTrackConfigDto)).rejects.toThrow(
                error,
            );
        });
    });

    describe('findAllTrackConfigs', () => {
        it('should return all pillar track configs', async () => {
            // Arrange
            const mockConfigs = [mockPillarTrackConfig];
            mockPrismaService.pillarTrackConfig.findMany.mockResolvedValue(mockConfigs);

            // Act
            const result = await service.findAllTrackConfigs();

            // Assert
            expect(mockPrismaService.pillarTrackConfig.findMany).toHaveBeenCalledWith({
                include: {
                    pillar: {
                        include: {
                            criteria: true,
                        },
                    },
                },
            });
            expect(result).toEqual(mockConfigs);
        });

        it('should filter by track and position when provided', async () => {
            // Arrange
            const mockConfigs = [mockPillarTrackConfig];
            mockPrismaService.pillarTrackConfig.findMany.mockResolvedValue(mockConfigs);

            // Act
            const result = await service.findTrackConfigsByTrackAndPosition('Backend', 'Developer');

            // Assert
            expect(mockPrismaService.pillarTrackConfig.findMany).toHaveBeenCalledWith({
                where: {
                    track: 'Backend',
                    position: 'Developer',
                    isActive: true,
                },
                include: {
                    pillar: {
                        include: {
                            criteria: true,
                        },
                    },
                },
            });
            expect(result).toEqual(mockConfigs);
        });
    });

    describe('updateTrackConfig', () => {
        it('should update a pillar track config successfully', async () => {
            // Arrange
            const updatedConfig = {
                ...mockPillarTrackConfig,
                ...mockUpdatePillarTrackConfigDto,
            };
            mockPrismaService.pillarTrackConfig.findUnique.mockResolvedValue(mockPillarTrackConfig);
            mockPrismaService.pillarTrackConfig.update.mockResolvedValue(updatedConfig);

            // Act
            const result = await service.updateTrackConfig(
                1,
                'Backend',
                'Developer',
                mockUpdatePillarTrackConfigDto,
            );

            // Assert
            expect(mockPrismaService.pillarTrackConfig.update).toHaveBeenCalledWith({
                where: {
                    pillarId_track_position: {
                        pillarId: 1,
                        track: 'Backend',
                        position: 'Developer',
                    },
                },
                data: mockUpdatePillarTrackConfigDto,
                include: {
                    pillar: {
                        include: {
                            criteria: true,
                        },
                    },
                },
            });
            expect(result).toEqual(updatedConfig);
        });

        it('should throw NotFoundException when config not found', async () => {
            // Arrange
            mockPrismaService.pillarTrackConfig.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.updateTrackConfig(
                    999,
                    'Backend',
                    'Developer',
                    mockUpdatePillarTrackConfigDto,
                ),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('removeTrackConfig', () => {
        it('should remove a pillar track config successfully', async () => {
            // Arrange
            mockPrismaService.pillarTrackConfig.findUnique.mockResolvedValue(mockPillarTrackConfig);
            mockPrismaService.pillarTrackConfig.delete.mockResolvedValue(mockPillarTrackConfig);

            // Act
            const result = await service.removeTrackConfig(1, 'Backend', 'Developer');

            // Assert
            expect(mockPrismaService.pillarTrackConfig.delete).toHaveBeenCalledWith({
                where: {
                    pillarId_track_position: {
                        pillarId: 1,
                        track: 'Backend',
                        position: 'Developer',
                    },
                },
            });
            expect(result).toEqual(mockPillarTrackConfig);
        });

        it('should throw NotFoundException when config not found', async () => {
            // Arrange
            mockPrismaService.pillarTrackConfig.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.removeTrackConfig(999, 'Backend', 'Developer')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
