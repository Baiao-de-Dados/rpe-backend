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

        function getCycleDates(cycleName: string): { startDate: Date; endDate: Date } {
            const [year, semester] = cycleName.split('.');
            if (semester === '1') {
                return {
                    startDate: new Date(`${year}-01-01T00:00:00Z`),
                    endDate: new Date(`${year}-06-30T23:59:59Z`),
                };
            } else if (semester === '2') {
                return {
                    startDate: new Date(`${year}-07-01T00:00:00Z`),
                    endDate: new Date(`${year}-12-31T23:59:59Z`),
                };
            }
            return {
                startDate: new Date(`${year}-01-01T00:00:00Z`),
                endDate: new Date(`${year}-12-31T23:59:59Z`),
            };
        }

        let cycleConfig = await this.prisma.cycleConfig.findUnique({
            where: { name: cycleName },
        });
        if (!cycleConfig) {
            const { startDate, endDate } = getCycleDates(cycleName);
            cycleConfig = await this.prisma.cycleConfig.create({
                data: {
                    name: cycleName,
                    startDate,
                    endDate,
                    description: '',
                    done: true,
                },
            });
        }
        const cycleConfigId = cycleConfig.id;

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
            criterion?: string;
            note?: number;
            justification?: string;
            avaliadoEmail?: string;
            avaliadoName?: string;
            pontosFortes?: string;
            pontosMelhoria?: string;
        }[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const values = Array.isArray(row.values) ? row.values : [];
            const [
                name,
                email,
                evaluationType,
                criterion,
                note,
                justification,
                a360Name,
                nota360,
                pontosMelhoria,
                pontosFortes,
                referenciaName,
                justificativaReferencia,
            ] = values.slice(1);

            const evaluation: any = {
                name: typeof name === 'string' ? name.trim() : '',
                email: typeof email === 'string' ? email.trim() : '',
                evaluationType: typeof evaluationType === 'string' ? evaluationType.trim() : '',
            };

            if (evaluationType === 'Autoavaliação') {
                evaluation.criterion = typeof criterion === 'string' ? criterion.trim() : '';
                evaluation.note = typeof note === 'number' ? note : Number(note) || 0;
                evaluation.justification =
                    typeof justification === 'string' ? justification.trim() : '';
            } else if (evaluationType === 'Avaliação 360') {
                evaluation.avaliadoName = typeof a360Name === 'string' ? a360Name.trim() : '';
                evaluation.note = typeof nota360 === 'number' ? nota360 : Number(nota360) || 0;
                evaluation.pontosFortes =
                    typeof pontosFortes === 'string' ? pontosFortes.trim() : '';
                evaluation.pontosMelhoria =
                    typeof pontosMelhoria === 'string' ? pontosMelhoria.trim() : '';
            } else if (
                evaluationType === 'Pesquisa de Referência' ||
                evaluationType === 'Pesquisa de Referências'
            ) {
                evaluation.avaliadoName =
                    typeof referenciaName === 'string' ? referenciaName.trim() : '';
                evaluation.justification =
                    typeof justificativaReferencia === 'string'
                        ? justificativaReferencia.trim()
                        : '';
            }

            evaluations.push(evaluation);
        });

        const tiposUnicos = new Set(evaluations.map((e) => e.evaluationType));
        console.log('TIPOS DE AVALIAÇÃO ENCONTRADOS NO EXCEL:', Array.from(tiposUnicos));
        console.log(
            'DADOS DE 360 NO EXCEL:',
            evaluations.filter(
                (e) =>
                    removeDiacritics((e.evaluationType || '').toLowerCase().trim()) ===
                    'avaliacao 360',
            ),
        );
        console.log(
            'DADOS DE REFERÊNCIA NO EXCEL:',
            evaluations.filter((e) => {
                const tipoNorm = removeDiacritics((e.evaluationType || '').toLowerCase().trim());
                return (
                    tipoNorm === 'pesquisa de referencia' || tipoNorm === 'pesquisa de referencias'
                );
            }),
        );

        const criteriosDb = await this.prisma.criterion.findMany();
        const criteriosNameToId = Object.fromEntries(
            criteriosDb.map((c) => [removeDiacritics(c.name.toLowerCase().trim()), c.id]),
        );
        const criteriosIdToPilar = Object.fromEntries(criteriosDb.map((c) => [c.id, c.pillarId]));
        console.log('CRITÉRIOS NO BANCO:');
        criteriosDb.forEach((c) => {
            console.log('-', c.name);
        });
        const allUsersDb = await this.prisma.user.findMany();
        console.log('USUÁRIOS NO BANCO:');
        allUsersDb.forEach((u) => {
            console.log('-', u.name);
        });
        const avaliacoesPorUsuario: Record<string, any[]> = {};
        for (const evaluation of evaluations) {
            if (!evaluation.criterion || evaluation.criterion.trim() === '') {
                continue;
            }
            if (!avaliacoesPorUsuario[evaluation.email]) {
                avaliacoesPorUsuario[evaluation.email] = [];
            }
            avaliacoesPorUsuario[evaluation.email].push(evaluation);
        }
        let importedCount = 0;
        function tipoNorm(tipo: string) {
            return removeDiacritics((tipo || '').toLowerCase().trim());
        }
        for (const email in avaliacoesPorUsuario) {
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) continue;
            const existing = await this.prisma.evaluation.findFirst({
                where: {
                    evaluatorId: user.id,
                    cycleConfigId: cycleConfigId,
                },
            });
            if (existing) continue;
            const criteriosPorPilar: Record<number, any[]> = {};
            const avaliacao360: any[] = [];
            const referencias: any[] = [];
            const linhasAvaliador = evaluations.filter((e) => e.email === email);
            console.log(`\n--- Linhas do Excel para ${email} ---`);
            linhasAvaliador.forEach((e) => console.log(e));
            for (const evaluation of linhasAvaliador) {
                const tipo = tipoNorm(evaluation.evaluationType);
                if (tipo === 'autoavaliacao') {
                    const normalizedName = removeDiacritics(
                        evaluation.criterion?.toLowerCase() || '',
                    );
                    const criterioId = criteriosNameToId[normalizedName];
                    const criterioDb = criteriosDb.find((c) => c.id === criterioId);
                    if (!criterioId) {
                        console.log('Critério Excel NÃO ENCONTRADO:', evaluation.criterion);
                        const critExcelNorm = normalizedName;
                        const sugestoes = Object.keys(criteriosNameToId).filter(
                            (nome) => nome.includes(critExcelNorm) || critExcelNorm.includes(nome),
                        );
                        if (sugestoes.length > 0) {
                            console.log('Sugestões de nomes próximos:', sugestoes);
                        } else {
                            console.log('Nenhuma sugestão próxima encontrada.');
                        }
                    } else {
                        console.log(
                            'Critério Excel ENCONTRADO:',
                            evaluation.criterion,
                            '-> nomeBanco:',
                            criterioDb?.name,
                        );
                    }
                    if (!criterioId) {
                        continue;
                    }
                    const pilarId = criteriosIdToPilar[criterioId];
                    if (!criteriosPorPilar[pilarId]) criteriosPorPilar[pilarId] = [];
                    criteriosPorPilar[pilarId].push({
                        criterioId,
                        nota: evaluation.note,
                        justificativa: evaluation.justification,
                    });
                } else if (tipo === 'avaliacao 360') {
                    const nomeBusca = evaluation.avaliadoName || '';
                    const nomeBuscaNorm = removeDiacritics(nomeBusca.toLowerCase());
                    console.log(
                        'NOME BUSCADO:',
                        nomeBuscaNorm,
                        '| NOMES NO BANCO:',
                        allUsersDb.map((u) => removeDiacritics(u.name.toLowerCase())),
                    );
                    const avaliado = allUsersDb.find(
                        (u) => removeDiacritics(u.name.toLowerCase()) === nomeBuscaNorm,
                    );
                    console.log(
                        '[DEBUG 360] Avaliando:',
                        nomeBusca,
                        '| Normalizado:',
                        nomeBuscaNorm,
                        '| Encontrado:',
                        !!avaliado,
                    );
                    if (!avaliado) {
                        const sugestoes = allUsersDb
                            .filter(
                                (u) =>
                                    removeDiacritics(u.name.toLowerCase()).includes(
                                        nomeBuscaNorm,
                                    ) ||
                                    nomeBuscaNorm.includes(removeDiacritics(u.name.toLowerCase())),
                            )
                            .map((u) => u.name);
                        console.log(
                            'Usuário avaliado (360) não encontrado:',
                            nomeBusca,
                            '| Sugestões:',
                            sugestoes,
                        );
                        continue;
                    }
                    avaliacao360.push({
                        avaliadoId: avaliado.id,
                        pontosFortes: evaluation.pontosFortes || '',
                        pontosMelhoria: evaluation.pontosMelhoria || '',
                        score: evaluation.note || 0,
                    });
                } else if (
                    tipo === 'pesquisa de referencia' ||
                    tipo === 'pesquisa de referencias'
                ) {
                    const nomeBusca = evaluation.avaliadoName || '';
                    const nomeBuscaNorm = removeDiacritics(nomeBusca.toLowerCase());
                    console.log(
                        'NOME BUSCADO:',
                        nomeBuscaNorm,
                        '| NOMES NO BANCO:',
                        allUsersDb.map((u) => removeDiacritics(u.name.toLowerCase())),
                    );
                    const colaborador = allUsersDb.find(
                        (u) => removeDiacritics(u.name.toLowerCase()) === nomeBuscaNorm,
                    );
                    console.log(
                        '[DEBUG REFERÊNCIA] Referenciando:',
                        nomeBusca,
                        '| Normalizado:',
                        nomeBuscaNorm,
                        '| Encontrado:',
                        !!colaborador,
                    );
                    if (!colaborador) {
                        const sugestoes = allUsersDb
                            .filter(
                                (u) =>
                                    removeDiacritics(u.name.toLowerCase()).includes(
                                        nomeBuscaNorm,
                                    ) ||
                                    nomeBuscaNorm.includes(removeDiacritics(u.name.toLowerCase())),
                            )
                            .map((u) => u.name);
                        console.log(
                            'Colaborador de referência não encontrado:',
                            nomeBusca,
                            '| Sugestões:',
                            sugestoes,
                        );
                        continue;
                    }
                    referencias.push({
                        colaboradorId: colaborador.id,
                        justificativa: evaluation.justification || '',
                    });
                }
            }
            const pilares = Object.entries(criteriosPorPilar).map(([pilarId, criterios]) => ({
                pilarId: Number(pilarId),
                criterios,
            }));
            const createEvaluationDto: CreateEvaluationDto = {
                cycleConfigId: cycleConfigId,
                colaboradorId: user.id,
                autoavaliacao: { pilares },
                avaliacao360,
                mentoring: {
                    mentorId: 0,
                    justificativa: '',
                },
                referencias,
            };
            console.log('DTO FINAL PARA CRIAÇÃO:', JSON.stringify(createEvaluationDto, null, 2));
            await this.evaluationsService.createEvaluation(
                createEvaluationDto,
                {
                    id: user.id,
                    sub: user.id,
                },
                true,
            );
            importedCount++;
        }
        return `${importedCount} avaliações importadas com sucesso no ciclo ${cycleName}.`;
    }
}
