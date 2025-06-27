import { Test, TestingModule } from '@nestjs/testing';
import { ReferenceService } from './reference.service';
import { BadRequestException } from '@nestjs/common';

describe('ReferenceService', () => {
    let service: ReferenceService;
    let mockPrismaService: any;

    const mockReferencias = [
        {
            colaboradorId: '2',
            justificativa: 'Referência técnica',
            tagIds: [1, 2],
        },
    ];

    beforeEach(async () => {
        mockPrismaService = {
            reference: {
                create: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [ReferenceService],
        }).compile();

        service = module.get<ReferenceService>(ReferenceService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createReferences', () => {
        it('should create references successfully', async () => {
            // Arrange
            mockPrismaService.reference.create.mockResolvedValue({
                id: 1,
                fromId: 1,
                toId: 2,
                tags: ['1', '2'],
                comment: 'Referência técnica',
            });

            // Act
            await service.createReferences(mockPrismaService, mockReferencias, 1);

            // Assert
            expect(mockPrismaService.reference.create).toHaveBeenCalledWith({
                data: {
                    fromId: 1,
                    toId: 2,
                    tags: ['1', '2'],
                    comment: 'Referência técnica',
                },
            });
        });

        it('should throw error if referencias is empty', async () => {
            // Act & Assert
            await expect(service.createReferences(mockPrismaService, [], 1)).rejects.toThrow(
                new BadRequestException('Referências são obrigatórias'),
            );
        });

        it('should throw error if tagIds is missing', async () => {
            // Arrange
            const invalidReferencias = [
                {
                    colaboradorId: '2',
                    justificativa: 'Referência técnica',
                    // tagIds missing
                },
            ];

            // Act & Assert
            await expect(
                service.createReferences(mockPrismaService, invalidReferencias, 1),
            ).rejects.toThrow(new BadRequestException('Tags são obrigatórias na referência'));
        });

        it('should throw error if tagIds is empty', async () => {
            // Arrange
            const invalidReferencias = [
                {
                    colaboradorId: '2',
                    justificativa: 'Referência técnica',
                    tagIds: [],
                },
            ];

            // Act & Assert
            await expect(
                service.createReferences(mockPrismaService, invalidReferencias, 1),
            ).rejects.toThrow(new BadRequestException('Tags não podem estar vazias'));
        });

        it('should throw error if justificativa is missing', async () => {
            // Arrange
            const invalidReferencias = [
                {
                    colaboradorId: '2',
                    tagIds: [1, 2],
                    // justificativa missing
                },
            ];

            // Act & Assert
            await expect(
                service.createReferences(mockPrismaService, invalidReferencias, 1),
            ).rejects.toThrow(new BadRequestException('Justificativa é obrigatória na referência'));
        });

        it('should throw error if colaboradorId is missing', async () => {
            // Arrange
            const invalidReferencias = [
                {
                    justificativa: 'Referência técnica',
                    tagIds: [1, 2],
                    // colaboradorId missing
                },
            ];

            // Act & Assert
            await expect(
                service.createReferences(mockPrismaService, invalidReferencias, 1),
            ).rejects.toThrow(
                new BadRequestException('ID do colaborador de referência é obrigatório'),
            );
        });

        it('should handle empty array', async () => {
            // Act & Assert
            await expect(service.createReferences(mockPrismaService, [], 1)).rejects.toThrow(
                new BadRequestException('Referências são obrigatórias'),
            );
        });
    });
});
