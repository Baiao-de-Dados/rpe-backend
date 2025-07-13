import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CollaboratorsService } from '../../evaluations/collaborators/collaborators.service';

@Injectable()
export class ExportEvaluationsService {
    constructor(private readonly collaboratorsService: CollaboratorsService) {}

    async generateExport(): Promise<Buffer> {
        const collaborators = await this.collaboratorsService.getCollaboratorsScores();

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
        ];

        // Adiciona dados
        for (const collaborator of collaborators) {
            for (const evaluation of collaborator.evaluations) {
                worksheet.addRow({
                    name: collaborator.name,
                    track: collaborator.track,
                    position: collaborator.position,
                    cycle: evaluation.cycleId,
                    autoEvaluationScore: evaluation.autoEvaluationScore,
                    evaluation360Score: evaluation.evaluation360Score,
                    mentoringScore: evaluation.mentoringScore,
                    finalEqualizationScore: evaluation.finalEqualizationScore,
                });
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
