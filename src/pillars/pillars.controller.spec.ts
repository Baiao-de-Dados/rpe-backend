import { Test, TestingModule } from '@nestjs/testing';
import { PillarsController } from './pillars.controller';
import { PillarsService } from './pillars.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';
import { CreatePillarTrackConfigDto } from './dto/create-pillar-track-config.dto';
import { UpdatePillarTrackConfigDto } from './dto/update-pillar-track-config.dto';
import { NotFoundException } from '@nestjs/common';

describe('PillarsController', () => {
    let controller: PillarsController;
    let mockPillarsService: any;

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
        mockPillarsService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            createTrackConfig: jest.fn(),
            findAllTrackConfigs: jest.fn(),
            findOneTrackConfig: jest.fn(),
            updateTrackConfig: jest.fn(),
            removeTrackConfig: jest.fn(),
            findTrackConfigsByTrackAndPosition: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PillarsController],
            providers: [
                {
                    provide: PillarsService,
                    useValue: mockPillarsService,
                },
            ],
        }).compile();

        controller = module.get<PillarsController>(PillarsController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a pillar', async () => {
            // Arrange
            mockPillarsService.create.mockResolvedValue(mockPillar);

            // Act
            const result = await controller.create(mockCreatePillarDto);

            // Assert
            expect(mockPillarsService.create).toHaveBeenCalledWith(mockCreatePillarDto);
            expect(result).toEqual(mockPillar);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockPillarsService.create.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.create(mockCreatePillarDto)).rejects.toThrow(error);
        });
    });

    describe('findAll', () => {
        it('should return all pillars', async () => {
            // Arrange
            const mockPillars = [mockPillar];
            mockPillarsService.findAll.mockResolvedValue(mockPillars);

            // Act
            const result = await controller.findAll();

            // Assert
            expect(mockPillarsService.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockPillars);
        });

        it('should return empty array when no pillars exist', async () => {
            // Arrange
            mockPillarsService.findAll.mockResolvedValue([]);

            // Act
            const result = await controller.findAll();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a pillar by id', async () => {
            // Arrange
            mockPillarsService.findOne.mockResolvedValue(mockPillar);

            // Act
            const result = await controller.findOne(1);

            // Assert
            expect(mockPillarsService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockPillar);
        });

        it('should handle not found error', async () => {
            // Arrange
            mockPillarsService.findOne.mockRejectedValue(
                new NotFoundException('Pilar não encontrado'),
            );

            // Act & Assert
            await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a pillar', async () => {
            // Arrange
            const updatedPillar = { ...mockPillar, ...mockUpdatePillarDto };
            mockPillarsService.update.mockResolvedValue(updatedPillar);

            // Act
            const result = await controller.update(1, mockUpdatePillarDto);

            // Assert
            expect(mockPillarsService.update).toHaveBeenCalledWith(1, mockUpdatePillarDto);
            expect(result).toEqual(updatedPillar);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockPillarsService.update.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.update(1, mockUpdatePillarDto)).rejects.toThrow(error);
        });
    });

    describe('remove', () => {
        it('should remove a pillar', async () => {
            // Arrange
            mockPillarsService.remove.mockResolvedValue(mockPillar);

            // Act
            const result = await controller.remove(1);

            // Assert
            expect(mockPillarsService.remove).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockPillar);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockPillarsService.remove.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.remove(1)).rejects.toThrow(error);
        });
    });

    describe('createTrackConfig', () => {
        it('should create a pillar track config', async () => {
            // Arrange
            mockPillarsService.createTrackConfig.mockResolvedValue(mockPillarTrackConfig);

            // Act
            const result = await controller.createTrackConfig(mockCreatePillarTrackConfigDto);

            // Assert
            expect(mockPillarsService.createTrackConfig).toHaveBeenCalledWith(
                mockCreatePillarTrackConfigDto,
            );
            expect(result).toEqual(mockPillarTrackConfig);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockPillarsService.createTrackConfig.mockRejectedValue(error);

            // Act & Assert
            await expect(
                controller.createTrackConfig(mockCreatePillarTrackConfigDto),
            ).rejects.toThrow(error);
        });
    });

    describe('findAllTrackConfigs', () => {
        it('should return all pillar track configs', async () => {
            // Arrange
            const mockConfigs = [mockPillarTrackConfig];
            mockPillarsService.findAllTrackConfigs.mockResolvedValue(mockConfigs);

            // Act
            const result = await controller.findAllTrackConfigs();

            // Assert
            expect(mockPillarsService.findAllTrackConfigs).toHaveBeenCalled();
            expect(result).toEqual(mockConfigs);
        });
    });

    describe('findTrackConfigsByFilter', () => {
        it('should filter by track and position when provided', async () => {
            // Arrange
            const mockConfigs = [mockPillarTrackConfig];
            mockPillarsService.findTrackConfigsByTrackAndPosition.mockResolvedValue(mockConfigs);

            // Act
            const result = await controller.findTrackConfigsByFilter('Backend', 'Developer');

            // Assert
            expect(mockPillarsService.findTrackConfigsByTrackAndPosition).toHaveBeenCalledWith(
                'Backend',
                'Developer',
            );
            expect(result).toEqual(mockConfigs);
        });
    });

    describe('updateTrackConfig', () => {
        it('should update a pillar track config', async () => {
            // Arrange
            const updatedConfig = { ...mockPillarTrackConfig, ...mockUpdatePillarTrackConfigDto };
            mockPillarsService.updateTrackConfig.mockResolvedValue(updatedConfig);

            // Act
            const result = await controller.updateTrackConfig(1, mockUpdatePillarTrackConfigDto);

            // Assert
            expect(mockPillarsService.updateTrackConfig).toHaveBeenCalledWith(
                1,
                null,
                null,
                mockUpdatePillarTrackConfigDto,
            );
            expect(result).toEqual(updatedConfig);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockPillarsService.updateTrackConfig.mockRejectedValue(error);

            // Act & Assert
            await expect(
                controller.updateTrackConfig(1, mockUpdatePillarTrackConfigDto),
            ).rejects.toThrow(error);
        });
    });

    describe('removeTrackConfig', () => {
        it('should remove a pillar track config', async () => {
            // Arrange
            mockPillarsService.removeTrackConfig.mockResolvedValue(mockPillarTrackConfig);

            // Act
            const result = await controller.removeTrackConfig(1);

            // Assert
            expect(mockPillarsService.removeTrackConfig).toHaveBeenCalledWith(1, null, null);
            expect(result).toEqual(mockPillarTrackConfig);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockPillarsService.removeTrackConfig.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.removeTrackConfig(1)).rejects.toThrow(error);
        });
    });
});
