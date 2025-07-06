import { Test, TestingModule } from '@nestjs/testing';
import { CriteriaController } from './criteria.controller';
import { CriteriaService } from './criteria.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { CreateCriterionTrackConfigDto } from '../evaluations/autoevaluations/criteria/dto/create-criterion-track-config.dto';
import { UpdateCriterionTrackConfigDto } from './dto/update-criterion-track-config.dto';
import { NotFoundException } from '@nestjs/common';

describe('CriteriaController', () => {
    let controller: CriteriaController;
    let mockCriteriaService: any;

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
        name: 'Conhecimento Técnico',
        description: 'Domínio das tecnologias utilizadas',
        pillarId: 1,
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
        mockCriteriaService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findByPillar: jest.fn(),
            createTrackConfig: jest.fn(),
            findAllTrackConfigs: jest.fn(),
            findTrackConfigsByTrackAndPosition: jest.fn(),
            findActiveCriteriaForUser: jest.fn(),
            updateTrackConfig: jest.fn(),
            removeTrackConfig: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CriteriaController],
            providers: [
                {
                    provide: CriteriaService,
                    useValue: mockCriteriaService,
                },
            ],
        }).compile();

        controller = module.get<CriteriaController>(CriteriaController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a criterion', async () => {
            // Arrange
            mockCriteriaService.create.mockResolvedValue(mockCriterion);

            // Act
            const result = await controller.create(mockCreateCriterionDto);

            // Assert
            expect(mockCriteriaService.create).toHaveBeenCalledWith(mockCreateCriterionDto);
            expect(result).toEqual(mockCriterion);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockCriteriaService.create.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.create(mockCreateCriterionDto)).rejects.toThrow(error);
        });
    });

    describe('findAll', () => {
        it('should return all criteria', async () => {
            // Arrange
            const mockCriteria = [mockCriterion];
            mockCriteriaService.findAll.mockResolvedValue(mockCriteria);

            // Act
            const result = await controller.findAll();

            // Assert
            expect(mockCriteriaService.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockCriteria);
        });

        it('should return empty array when no criteria exist', async () => {
            // Arrange
            mockCriteriaService.findAll.mockResolvedValue([]);

            // Act
            const result = await controller.findAll();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('findByPillar', () => {
        it('should return criteria by pillar', async () => {
            // Arrange
            const mockCriteria = [mockCriterion];
            mockCriteriaService.findByPillar.mockResolvedValue(mockCriteria);

            // Act
            const result = await controller.findByPillar(1);

            // Assert
            expect(mockCriteriaService.findByPillar).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCriteria);
        });
    });

    describe('findOne', () => {
        it('should return a criterion by id', async () => {
            // Arrange
            mockCriteriaService.findOne.mockResolvedValue(mockCriterion);

            // Act
            const result = await controller.findOne(1);

            // Assert
            expect(mockCriteriaService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCriterion);
        });

        it('should handle not found error', async () => {
            // Arrange
            mockCriteriaService.findOne.mockRejectedValue(
                new NotFoundException('Critério não encontrado'),
            );

            // Act & Assert
            await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a criterion', async () => {
            // Arrange
            const updatedCriterion = { ...mockCriterion, ...mockUpdateCriterionDto };
            mockCriteriaService.update.mockResolvedValue(updatedCriterion);

            // Act
            const result = await controller.update(1, mockUpdateCriterionDto);

            // Assert
            expect(mockCriteriaService.update).toHaveBeenCalledWith(1, mockUpdateCriterionDto);
            expect(result).toEqual(updatedCriterion);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockCriteriaService.update.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.update(1, mockUpdateCriterionDto)).rejects.toThrow(error);
        });
    });

    describe('remove', () => {
        it('should remove a criterion', async () => {
            // Arrange
            mockCriteriaService.remove.mockResolvedValue(mockCriterion);

            // Act
            const result = await controller.remove(1);

            // Assert
            expect(mockCriteriaService.remove).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCriterion);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockCriteriaService.remove.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.remove(1)).rejects.toThrow(error);
        });
    });

    describe('createTrackConfig', () => {
        it('should create a criterion track config', async () => {
            // Arrange
            mockCriteriaService.createTrackConfig.mockResolvedValue(mockCriterionTrackConfig);

            // Act
            const result = await controller.createTrackConfig(mockCreateCriterionTrackConfigDto);

            // Assert
            expect(mockCriteriaService.createTrackConfig).toHaveBeenCalledWith(
                mockCreateCriterionTrackConfigDto,
            );
            expect(result).toEqual(mockCriterionTrackConfig);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockCriteriaService.createTrackConfig.mockRejectedValue(error);

            // Act & Assert
            await expect(
                controller.createTrackConfig(mockCreateCriterionTrackConfigDto),
            ).rejects.toThrow(error);
        });
    });

    describe('findAllTrackConfigs', () => {
        it('should return all criterion track configs', async () => {
            // Arrange
            const mockConfigs = [mockCriterionTrackConfig];
            mockCriteriaService.findAllTrackConfigs.mockResolvedValue(mockConfigs);

            // Act
            const result = await controller.findAllTrackConfigs();

            // Assert
            expect(mockCriteriaService.findAllTrackConfigs).toHaveBeenCalled();
            expect(result).toEqual(mockConfigs);
        });
    });

    describe('findTrackConfigsByFilter', () => {
        it('should return filtered track configs', async () => {
            // Arrange
            const mockConfigs = [mockCriterionTrackConfig];
            mockCriteriaService.findTrackConfigsByTrackAndPosition.mockResolvedValue(mockConfigs);

            // Act
            const result = await controller.findTrackConfigsByFilter('Backend', 'Developer');

            // Assert
            expect(mockCriteriaService.findTrackConfigsByTrackAndPosition).toHaveBeenCalledWith(
                'Backend',
                'Developer',
            );
            expect(result).toEqual(mockConfigs);
        });
    });

    describe('findActiveCriteriaForUser', () => {
        it('should return active criteria for user', async () => {
            // Arrange
            const mockCriteria = [mockCriterion];
            mockCriteriaService.findActiveCriteriaForUser.mockResolvedValue(mockCriteria);

            // Act
            const result = await controller.findActiveCriteriaForUser(1);

            // Assert
            expect(mockCriteriaService.findActiveCriteriaForUser).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCriteria);
        });
    });

    describe('updateTrackConfig', () => {
        it('should update a criterion track config', async () => {
            // Arrange
            const updatedConfig = {
                ...mockCriterionTrackConfig,
                ...mockUpdateCriterionTrackConfigDto,
            };
            mockCriteriaService.updateTrackConfig.mockResolvedValue(updatedConfig);

            // Act
            const result = await controller.updateTrackConfig(
                1,
                mockUpdateCriterionTrackConfigDto,
                'Backend',
                'Developer',
            );

            // Assert
            expect(mockCriteriaService.updateTrackConfig).toHaveBeenCalledWith(
                1,
                'Backend',
                'Developer',
                mockUpdateCriterionTrackConfigDto,
            );
            expect(result).toEqual(updatedConfig);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockCriteriaService.updateTrackConfig.mockRejectedValue(error);

            // Act & Assert
            await expect(
                controller.updateTrackConfig(1, mockUpdateCriterionTrackConfigDto),
            ).rejects.toThrow(error);
        });
    });

    describe('removeTrackConfig', () => {
        it('should remove a criterion track config', async () => {
            // Arrange
            mockCriteriaService.removeTrackConfig.mockResolvedValue(mockCriterionTrackConfig);

            // Act
            const result = await controller.removeTrackConfig(1, 'Backend', 'Developer');

            // Assert
            expect(mockCriteriaService.removeTrackConfig).toHaveBeenCalledWith(
                1,
                'Backend',
                'Developer',
            );
            expect(result).toEqual(mockCriterionTrackConfig);
        });

        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Service error');
            mockCriteriaService.removeTrackConfig.mockRejectedValue(error);

            // Act & Assert
            await expect(controller.removeTrackConfig(1)).rejects.toThrow(error);
        });
    });
});
