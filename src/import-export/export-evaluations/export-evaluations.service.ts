import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportEvaluationsService {
    constructor(private readonly prisma: PrismaService) {}

<<<<<<< HEAD
    async generateExport(): Promise<Buffer> {
        const collaborators = await this.prisma.user.findMany({
            include: {
                track: true,
                evaluator: {
                    include: {
                        autoEvaluation: {
                            include: { assignments: true },
                        },
                        evaluation360: true,
                        mentoring: true,
                        equalization: true, // Inclui a relação com o modelo Equalization
                    },
                },
            },
        });
=======
    async generateExport(cycleId: number): Promise<Buffer> {
        const collaborators = await this.collaboratorsService.getCollaborators();
>>>>>>> origin/test-import-evaluation

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
            { header: 'Nota Final da Equalização', key: 'equalizationScore', width: 20 },
        ];

        // Adiciona dados
        collaborators.forEach((collaborator) => {
<<<<<<< HEAD
            collaborator.evaluator?.forEach((evaluation) => {
                const autoEvaluationScore =
                    evaluation.autoEvaluation?.assignments &&
                    evaluation.autoEvaluation.assignments.length > 0
                        ? evaluation.autoEvaluation.assignments.reduce(
                              (sum, assignment) => sum + assignment.score,
                              0,
                          ) / evaluation.autoEvaluation.assignments.length
                        : 0;

                const evaluation360Score =
                    evaluation.evaluation360?.length > 0
                        ? evaluation.evaluation360.reduce(
                              (sum, eval360) => sum + eval360.score,
                              0,
                          ) / evaluation.evaluation360.length
                        : 0;

                const equalizationScore =
                    evaluation.equalization?.length > 0
                        ? evaluation.equalization.reduce((sum, eq) => sum + eq.score, 0) /
                          evaluation.equalization.length
                        : 0;

                worksheet.addRow({
                    name: collaborator.name,
                    track: collaborator.track?.name || 'Não informado',
                    position: collaborator.position,
                    cycle: evaluation.cycleConfigId,
                    autoEvaluationScore,
                    evaluation360Score,
                    mentoringScore: evaluation.mentoring?.score || 0,
                    equalizationScore,
=======
            collaborator.evaluations
                ?.filter((evaluation) => evaluation.cycleId === cycleId)
                .forEach((evaluation) => {
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
>>>>>>> origin/test-import-evaluation
                });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
