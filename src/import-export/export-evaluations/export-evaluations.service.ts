import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CollaboratorsService } from '../../evaluations/collaborators/collaborators.service';

@Injectable()
export class ExportEvaluationsService {
    constructor(private readonly collaboratorsService: CollaboratorsService) {}

    async generateExport(): Promise<Buffer> {
        const collaborators = await this.collaboratorsService.getCollaborators();

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
        collaborators.forEach((collaborator) => {
            collaborator.evaluations?.forEach((evaluation) => {
                worksheet.addRow({
                    name: collaborator.name,
                    track: collaborator.track,
                    position: collaborator.position,
                    cycle: evaluation.cycleId,
                    autoEvaluationScore: evaluation.autoEvaluationScore || 0,
                    evaluation360Score: evaluation.evaluation360Score || 0,
                    mentoringScore: evaluation.mentoringScore || 0,
                    finalEqualizationScore: evaluation.finalEqualizationScore || 0,
                });
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
