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
                const autoEvaluationScore =
                    evaluation.autoEvaluation && evaluation.autoEvaluation.assignments
                        ? evaluation.autoEvaluation.assignments.reduce(
                              (sum, a) => sum + a.score,
                              0,
                          ) / evaluation.autoEvaluation.assignments.length
                        : 0;

                worksheet.addRow({
                    name: collaborator.name,
                    email: collaborator.email,
                    position: collaborator.position,
                    track: collaborator.track,
                    cycleId: evaluation.cycleConfigId,
                    autoEvaluationScore: autoEvaluationScore,
                    evaluation360Score: evaluation.evaluation360?.[0]?.score || 0,
                    mentoringScore: evaluation.mentoring?.score || 0,
                    finalEqualizationScore: 0, // Não há mais equalização neste contexto
                });
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
