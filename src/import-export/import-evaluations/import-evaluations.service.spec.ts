import { Test, TestingModule } from '@nestjs/testing';
import { ImportEvaluationsService } from './import-evaluations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

// Mock do ExcelJS
jest.mock('exceljs', () => {
    return {
        Workbook: jest.fn().mockImplementation(() => ({
            xlsx: {
                load: jest.fn().mockResolvedValue(undefined),
            },
            getWorksheet: jest.fn().mockReturnValue({
                eachRow: (cb: any) => {
                    // Simula 3 linhas: cabeçalho, uma com critério em branco, uma válida
                    cb(
                        {
                            values: [
                                null,
                                'Nome 1',
                                'email1@teste.com',
                                'Tipo',
                                '',
                                10,
                                'Justificativa',
                            ],
                        },
                        2,
                    );
                    cb(
                        {
                            values: [
                                null,
                                'Nome 2',
                                'email2@teste.com',
                                'Tipo',
                                'Resiliência nas adversidades',
                                8,
                                'Justificativa',
                            ],
                        },
                        3,
                    );
                },
            }),
        })),
    };
});

describe('ImportEvaluationsService', () => {
    let service: ImportEvaluationsService;
    let prisma: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImportEvaluationsService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn().mockImplementation(({ where }) => {
                                if (where.email === 'email2@teste.com')
                                    return { id: 2, email: 'email2@teste.com' };
                                return null;
                            }),
                        },
                        criterion: {
                            findMany: jest
                                .fn()
                                .mockResolvedValue([{ name: 'Resiliência nas adversidades' }]),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<ImportEvaluationsService>(ImportEvaluationsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('deve pular avaliações com critério em branco', async () => {
        const file = { buffer: Buffer.from('') } as any;
        const filename = '2024.1.xlsx';

        // Não deve lançar erro, pois a linha com critério em branco é ignorada
        await expect(service.importEvaluationsFromExcel(file, filename)).resolves.toContain(
            '1 avaliações importadas',
        );
    });

    it('deve lançar erro se usuário não for encontrado', async () => {
        const file = { buffer: Buffer.from('') } as any;
        const filename = '2024.1.xlsx';
        // Altera o mock para não encontrar o usuário
        prisma.user.findUnique.mockResolvedValue(null);
        await expect(service.importEvaluationsFromExcel(file, filename)).rejects.toThrow(
            BadRequestException,
        );
    });
});
