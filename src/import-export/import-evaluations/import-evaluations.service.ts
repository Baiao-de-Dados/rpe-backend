import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { remove as removeDiacritics } from 'diacritics';
import { EvaluationsService } from '../../evaluations/evaluations.service';
import { CreateEvaluationDto } from '../../evaluations/dto/create-evaluation.dto';
import { EncryptionService } from 'src/cryptography/encryption.service';

@Injectable()
export class ImportEvaluationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly evaluationsService: EvaluationsService,
        private readonly encryptionService: EncryptionService,
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
                name, // 0
                email, // 1
                evaluationType, // 2
                criterion, // 3
                note, // 4 (autoavaliacao_nota)
                justification, // 5 (justificativa_autoavaliacao)
                a360Name, // 6
                ,
                ,
                nota360, // 9 (360_nota)
                pontosMelhoria, // 10
                pontosFortes, // 11
                referenciaName, // 12
                justificativaReferencia, // 13
            ] = values.slice(1);

            const evaluation: any = {
                name: typeof name === 'string' ? capitalizeName(name.trim()) : '', // Capitalizar o nome
                email: typeof email === 'string' ? email.trim() : '',
                evaluationType: typeof evaluationType === 'string' ? evaluationType.trim() : '',
            };

            if (evaluationType === 'Autoavaliação') {
                evaluation.criterion = typeof criterion === 'string' ? criterion.trim() : '';
                evaluation.note = typeof note === 'number' ? note : Number(note) || 0;
                evaluation.justification =
                    typeof justification === 'string' ? justification.trim() : '';
            } else if (evaluationType === 'Avaliação 360') {
                evaluation.avaliadoName = typeof a360Name === 'string' ? capitalizeName(a360Name.trim()) : ''; // Capitalizar o nome
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
                    typeof referenciaName === 'string' ? capitalizeName(referenciaName.trim()) : ''; // Capitalizar o nome
                evaluation.justification =
                    typeof justificativaReferencia === 'string'
                        ? justificativaReferencia.trim()
                        : '';
            }

            evaluations.push(evaluation);
        });

        const tiposUnicos = new Set(evaluations.map((e) => e.evaluationType));
        
        const criteriosDb = await this.prisma.criterion.findMany();
        const criteriosNameToId = Object.fromEntries(
            criteriosDb.map((c) => [removeDiacritics(c.name.toLowerCase().trim()), c.id]),
        );
        const criteriosIdToPilar = Object.fromEntries(criteriosDb.map((c) => [c.id, c.pillarId]));
        
        const allUsersDb = await this.prisma.user.findMany();
        
        const avaliacoesPorUsuario: Record<string, any[]> = {};
        for (const evaluation of evaluations) {
            if (!avaliacoesPorUsuario[evaluation.email]) {
                avaliacoesPorUsuario[evaluation.email] = [];
            }
            avaliacoesPorUsuario[evaluation.email].push(evaluation);
        }
        
        // Otimização: buscar todos os usuários uma vez e criar um mapa de emails descriptografados
        const allUsers = await this.prisma.user.findMany();
        const emailToUserMap: Record<string, any> = {};
        
        for (const dbUser of allUsers) {
            try {
                const decryptedEmail = this.encryptionService.safeDecrypt(dbUser.email);
                emailToUserMap[decryptedEmail] = dbUser;
            } catch (error) {
                // Continuar com próximo usuário
            }
        }

        let importedCount = 0;
        function tipoNorm(tipo: string) {
            return removeDiacritics((tipo || '').toLowerCase().trim());
        }
        
        for (const email in avaliacoesPorUsuario) {
            // Buscar usuário no mapa otimizado
            const user = emailToUserMap[email];

            if (!user) {
                continue;
            }

            const existing = await this.prisma.evaluation.findFirst({
                where: {
                    evaluatorId: user.id,
                    cycleConfigId: cycleConfigId,
                },
            });

            if (existing) {
                continue;
            }

            const criteriosPorPilar: Record<number, any[]> = {};
            const avaliacao360: any[] = [];
            const referencias: any[] = [];
            const linhasAvaliador = avaliacoesPorUsuario[email];

            for (const evaluation of linhasAvaliador) {
                const tipo = tipoNorm(evaluation.evaluationType);
                if (tipo === 'autoavaliacao') {
                    if (!evaluation.criterion || evaluation.criterion.trim() === '') {
                        continue;
                    }
                    const normalizedName = removeDiacritics(
                        evaluation.criterion?.toLowerCase() || '',
                    );
                    const criterioId = criteriosNameToId[normalizedName];
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
                    const nomeBuscaCapitalized = capitalizeName(nomeBusca);

                    const avaliado = allUsersDb.find((u) => capitalizeName(u.name) === nomeBuscaCapitalized);

                    if (avaliado) {
                        avaliacao360.push({
                            avaliadoId: avaliado.id,
                            pontosFortes: evaluation.pontosFortes || '',
                            pontosMelhoria: evaluation.pontosMelhoria || '',
                            score: evaluation.note || 0,
                        });
                    }
                } else if (
                    tipo === 'pesquisa de referencia' ||
                    tipo === 'pesquisa de referencias'
                ) {
                    const nomeBusca = evaluation.avaliadoName?.trim() || '';
                    if (nomeBusca) {
                        const nomeBuscaCapitalized = capitalizeName(nomeBusca);
                        const colaborador = allUsersDb.find((u) => capitalizeName(u.name) === nomeBuscaCapitalized);

                        if (colaborador) {
                            referencias.push({
                                colaboradorId: colaborador.id,
                                justificativa: evaluation.justification?.trim() || '',
                            });
                        }
                    }
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

            try {
                await this.evaluationsService.createEvaluation(
                    createEvaluationDto,
                    {
                        id: user.id,
                        sub: user.id,
                    },
                    true,
                );
                
                importedCount++;
            } catch (error) {
                console.error(`[ERROR] Erro ao importar avaliação para usuário ${user.id}:`, {
                    message: error.message,
                });
                // Continuar com próxima avaliação em vez de parar todo o processo
                continue;
            }
        }

        return `${importedCount} avaliações importadas com sucesso no ciclo ${cycleName}.`;
    }
}

function capitalizeName(name: string): string {
    return name
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}
