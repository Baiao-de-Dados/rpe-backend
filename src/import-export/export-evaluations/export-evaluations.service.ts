import { Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportEvaluationsService {
    constructor(private readonly prisma: PrismaService) {}

    async generateExport(cycleId: number): Promise<Buffer> {
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycleConfigId: cycleId },
            include: {
                evaluatee: {
                    include: { track: true }, // Inclui a trilha do avaliado
                },
                evaluator: true,
                autoEvaluation: {
                    include: { assignments: true },
                },
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
        });

        if (!evaluations.length) {
            throw new NotFoundException('Nenhuma avaliação encontrada para o ciclo especificado.');
        }

        return this.generateExcel(evaluations);
    }

    private async generateExcel(evaluations: any[]): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Equalização');

        // Adiciona cabeçalhos
        worksheet.columns = [
            { header: 'Nome do Colaborador', key: 'colaborador', width: 30 },
            { header: 'Trilha', key: 'trilha', width: 20 },
            { header: 'Projeto Atual', key: 'projeto', width: 20 },
            { header: 'Nota da Equalização', key: 'notaEqualizacao', width: 20 },
            { header: 'Justificativa do Comitê', key: 'justificativaComite', width: 30 },
            { header: 'Resumo GenAI', key: 'resumoGenAI', width: 30 },
            { header: 'Nota de Autoavaliação', key: 'notaAutoavaliacao', width: 20 },
            { header: 'Nota do Gestor', key: 'notaGestor', width: 20 },
            { header: 'Nota de Avaliação 360', key: 'nota360', width: 20 },
        ];

        // Adiciona dados
        for (const evaluation of evaluations) {
            const autoEvaluationScore =
                (evaluation.autoEvaluation?.assignments?.reduce((sum, a) => sum + a.score, 0) || 0) /
                (evaluation.autoEvaluation?.assignments.length || 1);

            // Busca o projeto atual do colaborador
            const project = await this.prisma.projectMember.findFirst({
                where: { userId: evaluation.evaluateeId },
                include: { project: true },
            });

            worksheet.addRow({
                colaborador: evaluation.evaluatee.name,
                trilha: evaluation.evaluatee.track?.name || 'Não informado',
                projeto: project?.project?.name || 'Não informado',
                notaEqualizacao: evaluation.status === 'COMPLETED' ? evaluation.trackId : null,
                justificativaComite: evaluation.reference?.justification || null, // Justificativa do Comitê
                resumoGenAI: null, // Será preenchido posteriormente
                notaAutoavaliacao: autoEvaluationScore || null,
                notaGestor: evaluation.mentoring?.score || null,
                nota360: evaluation.evaluation360?.score || null,
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
