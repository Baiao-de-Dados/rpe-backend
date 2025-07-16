import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CollaboratorsService } from '../../evaluations/collaborators/collaborators.service';

@Injectable()
export class ExportEvaluationsService {
    constructor(private readonly collaboratorsService: CollaboratorsService) {}

    async generateExport(cycleId: number): Promise<Buffer> {
        const collaborators = await this.collaboratorsService.getCollaborators();

        // Buscar informações do ciclo
        const cycle = await this.collaboratorsService['prisma'].cycleConfig.findUnique({
            where: { id: cycleId },
            select: { name: true },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Equalização');

        // Adiciona cabeçalhos
        worksheet.columns = [
            { header: 'Nome do Colaborador', key: 'name', width: 30 },
            { header: 'Trilha', key: 'track', width: 20 },
            { header: 'Posição', key: 'position', width: 20 },
            { header: 'Ciclo', key: 'cycle', width: 20 },
            { header: 'Nota de Autoavaliação', key: 'autoEvaluationScore', width: 20 },
            { header: 'Nota de Avaliação 360', key: 'evaluation360Score', width: 20 },
            { header: 'Nota do Gestor', key: 'mentoringScore', width: 20 },
            { header: 'Nota Final da Equalização', key: 'finalEqualizationScore', width: 20 },
            {
                header: 'Justificativa Final da Nota de Equalização',
                key: 'justificativaFinalEqualizacao',
                width: 40,
            },
            { header: 'Nota IA', key: 'ratingIA', width: 15 },
            { header: 'Resumo IA', key: 'summaryIA', width: 50 },
            { header: 'Discrepâncias IA', key: 'discrepanciesIA', width: 50 },
            { header: 'Detalhes IA', key: 'detailedAnalysisIA', width: 50 },
        ];

        for (const collaborator of collaborators) {
            const filteredScores =
                collaborator.scores?.filter((score) => score.cycleId === cycleId) || [];
            for (const score of filteredScores) {
                let justificativaFinalEqualizacao = '';
                let ratingIA = '';
                let summaryIA = '';
                let discrepanciesIA = '';
                let detailedAnalysisIA = '';

                const equalization = await this.collaboratorsService[
                    'prisma'
                ].equalization.findFirst({
                    where: {
                        collaboratorId: collaborator.id,
                        cycleId: score.cycleId,
                    },
                    select: { justification: true, aiSummary: true },
                });

                if (equalization) {
                    justificativaFinalEqualizacao = equalization.justification || '';

                    // Parse do JSON do aiSummary para extrair os campos separados
                    if (equalization.aiSummary) {
                        try {
                            const aiSummaryData =
                                typeof equalization.aiSummary === 'string'
                                    ? JSON.parse(equalization.aiSummary)
                                    : equalization.aiSummary;

                            if (aiSummaryData && typeof aiSummaryData === 'object') {
                                ratingIA = aiSummaryData.rating?.toString() || '';
                                summaryIA = aiSummaryData.summary || '';
                                discrepanciesIA = aiSummaryData.discrepancies || '';
                                detailedAnalysisIA = aiSummaryData.detailedAnalysis || '';
                            }
                        } catch (error) {
                            console.error('Erro ao fazer parse do aiSummary:', error);
                        }
                    }
                }

                worksheet.addRow({
                    name: collaborator.name,
                    track: collaborator.track,
                    position: collaborator.position,
                    cycle: cycle?.name,
                    autoEvaluationScore: score.autoEvaluationScore || 0,
                    evaluation360Score: score.av360Score || 0,
                    mentoringScore: score.managerScore || 0,
                    finalEqualizationScore: score.equalizationScore || 0,
                    justificativaFinalEqualizacao,
                    ratingIA,
                    summaryIA,
                    discrepanciesIA,
                    detailedAnalysisIA,
                });
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
