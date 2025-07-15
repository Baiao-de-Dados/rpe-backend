import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { remove as removeDiacritics } from 'diacritics';
import { EvaluationsService } from '../../evaluations/evaluations.service';
import { CreateEvaluationDto } from '../../evaluations/dto/create-evaluation.dto';

@Injectable()
export class ImportEvaluationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly evaluationsService: EvaluationsService,
    ) {}

    async importEvaluationsFromExcel(file: Express.Multer.File, filename: string): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado.');
        }

        const cycleNameMatch = filename.match(/(\d{4}\.\d)/);
        if (!cycleNameMatch) {
            throw new BadRequestException(
                'Nome do arquivo não contém um ciclo válido (ex.: 2024.1).',
            );
        }
        const cycleName = cycleNameMatch[1];

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);

        const worksheet = workbook.getWorksheet(1);
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
            if (rowNumber === 1) return;
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

        const allowedEmails = [
            'luiza.carvalho@rocketcorp.com',
            'vitor.gabriel@rocketcorp.com',
            'yuri.da@rocketcorp.com',
        ];
        const criteriosDb = await this.prisma.criterion.findMany();
        const criteriosNameToId = Object.fromEntries(
            criteriosDb.map((c) => [removeDiacritics(c.name.toLowerCase().trim()), c.id]),
        );
        const criteriosIdToPilar = Object.fromEntries(criteriosDb.map((c) => [c.id, c.pillarId]));
        const avaliacoesPorUsuario: Record<string, any[]> = {};
        for (const evaluation of evaluations) {
            if (!evaluation.criterion || evaluation.criterion.trim() === '') {
                continue;
            }
            if (!allowedEmails.includes(evaluation.email)) {
                continue;
            }
            if (!avaliacoesPorUsuario[evaluation.email]) {
                avaliacoesPorUsuario[evaluation.email] = [];
            }
            avaliacoesPorUsuario[evaluation.email].push(evaluation);
        }
        let importedCount = 0;
        for (const email in avaliacoesPorUsuario) {
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) continue;
            const existing = await this.prisma.evaluation.findFirst({
                where: {
                    evaluatorId: user.id,
                    cycleConfigId: 1,
                },
            });
            if (existing) continue;
            const criteriosPorPilar: Record<number, any[]> = {};
            for (const evaluation of avaliacoesPorUsuario[email]) {
                const normalizedName = removeDiacritics(evaluation.criterion.toLowerCase());
                const criterioId = criteriosNameToId[normalizedName];
                const criterioDb = criteriosDb.find((c) => c.id === criterioId);
                if (!criterioId) {
                    console.log('Critério Excel NÃO ENCONTRADO:', evaluation.criterion);
                    continue;
                }
                const pilarId = criteriosIdToPilar[criterioId];
                console.log(
                    'Critério Excel:',
                    evaluation.criterion,
                    '-> criterioId:',
                    criterioId,
                    '-> nomeBanco:',
                    criterioDb?.name,
                    '-> pilarId:',
                    pilarId,
                    '-> Justificativa:',
                    evaluation.justification,
                );
                if (!criteriosPorPilar[pilarId]) criteriosPorPilar[pilarId] = [];
                criteriosPorPilar[pilarId].push({
                    criterioId,
                    nota: evaluation.note,
                    justificativa: evaluation.justification,
                });
            }
            const pilares = Object.entries(criteriosPorPilar).map(([pilarId, criterios]) => ({
                pilarId: Number(pilarId),
                criterios,
            }));
            const createEvaluationDto: CreateEvaluationDto = {
                cycleConfigId: 1,
                colaboradorId: user.id,
                autoavaliacao: { pilares },
                avaliacao360: [],
                mentoring: {
                    mentorId: 0,
                    justificativa: '',
                },
                referencias: [],
            };
            await this.evaluationsService.createEvaluation(createEvaluationDto, {
                id: user.id,
                sub: user.id,
            });
            importedCount++;
        }
        return `${importedCount} avaliações importadas com sucesso no ciclo ${cycleName}.`;
    }
}
