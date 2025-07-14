import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImportEvaluationsService {
    constructor(private readonly prisma: PrismaService) {}

    async importEvaluationsFromExcel(file: Express.Multer.File, filename: string): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado.');
        }

        // Identifica o ciclo a partir do nome do arquivo
        const cycleNameMatch = filename.match(/(\d{4}\.\d)/);
        if (!cycleNameMatch) {
            throw new BadRequestException(
                'Nome do arquivo não contém um ciclo válido (ex.: 2024.1).',
            );
        }
        const cycleName = cycleNameMatch[1];

        // Busca o ciclo no banco de dados
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { name: cycleName },
        });
        if (!cycle) {
            throw new BadRequestException(`Ciclo ${cycleName} não encontrado no banco de dados.`);
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);

        const worksheet = workbook.getWorksheet(1); // Pega a primeira aba do Excel
        if (!worksheet) {
            throw new BadRequestException('A aba do Excel não foi encontrada.');
        }

        const evaluations: {
            name: string;
            email: string;
            evaluationType: string;
            criterion: string;
            note: number;
            justification: string;
        }[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Ignora o cabeçalho
            const values = Array.isArray(row.values) ? row.values : [];
            const [name, email, evaluationType, criterion, note, justification] = values
                .slice(1)
                .map((value) => (typeof value === 'string' ? value.trim() : value));

            evaluations.push({
                name: typeof name === 'string' ? name : '',
                email: typeof email === 'string' ? email : '',
                evaluationType: typeof evaluationType === 'string' ? evaluationType : '',
                criterion: typeof criterion === 'string' ? criterion : '',
                note: typeof note === 'number' ? note : 0,
                justification: typeof justification === 'string' ? justification : '',
            });
        });

        for (const evaluation of evaluations) {
            const user = await this.prisma.user.findUnique({
                where: { email: evaluation.email },
            });

            if (!user) {
                throw new BadRequestException(
                    `Usuário com email ${evaluation.email} não encontrado.`,
                );
            }

            const criterion = await this.prisma.criterion.findUnique({
                where: { name: evaluation.criterion },
            });

            if (!criterion) {
                throw new BadRequestException(
                    `Critério ${evaluation.criterion} não encontrado no banco de dados.`,
                );
            }
        }

        return `${evaluations.length} avaliações importadas com sucesso no ciclo ${cycleName}.`;
    }
}
