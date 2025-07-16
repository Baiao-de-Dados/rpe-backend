import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveEqualizationDto } from './dto/save-equalization.dto';

@Injectable()
export class EqualizationService {
    constructor(private readonly prisma: PrismaService) {}

    async saveEqualization(dto: SaveEqualizationDto) {
        const { cycleId, collaboratorId, rating, justification } = dto;

        // Verifica se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({ where: { id: cycleId } });
        if (!cycle) {
            throw new NotFoundException(`Ciclo com ID ${cycleId} não encontrado.`);
        }

        // Verifica se o colaborador existe
        const collaborator = await this.prisma.user.findUnique({ where: { id: collaboratorId } });
        if (!collaborator) {
            throw new NotFoundException(`Colaborador com ID ${collaboratorId} não encontrado.`);
        }

        // Verifica se já existe uma equalização para este colaborador neste ciclo
        const existingEqualization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId,
            },
        });

        if (existingEqualization) {
            throw new BadRequestException(
                `Já existe uma equalização para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        // Busca a avaliação associada ao colaborador e ciclo
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: collaboratorId,
                cycleConfigId: cycleId,
            },
        });

        if (!evaluation) {
            throw new NotFoundException(
                `Avaliação não encontrada para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        // Cria a equalização
        return this.prisma.equalization.create({
            data: {
                collaboratorId,
                cycleId,
                justification: justification,
                score: rating,
            },
        });
    }

    async editEqualization(dto: SaveEqualizationDto) {
        const { cycleId, collaboratorId, rating, justification } = dto;

        const equalization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId,
            },
        });

        if (!equalization) {
            throw new NotFoundException(
                `Equalização não encontrada para o ciclo ${cycleId} e colaborador ${collaboratorId}.`,
            );
        }

        // Atualiza a equalização
        return this.prisma.equalization.update({
            where: { id: equalization.id },
            data: {
                justification,
                score: rating,
            },
        });
    }

    async getEqualization(collaboratorId: number, cycleId: number) {
        const equalization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId,
            },
        });

        if (!equalization) {
            throw new NotFoundException('Equalização não encontrada');
        }

        return equalization;
    }

    /**
     * Retorna todos os colaboradores do sistema com suas avaliações para o COMMITTEE
     */
    async getAllCollaboratorsForCommittee(cycleId?: number) {
        // Buscar todos os usuários com papel EMPLOYER
        const collaborators = await this.prisma.user.findMany({
            where: {
                userRoles: {
                    some: {
                        role: 'EMPLOYER',
                        isActive: true,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                position: true,
            },
        });

        // Se não especificar ciclo, usar o ativo
        let targetCycleId = cycleId;
        if (!targetCycleId) {
            const activeCycle = (await this.prisma.cycleConfig.findMany()).find(
                (cycle) =>
                    !cycle.done &&
                    cycle.startDate !== null &&
                    cycle.endDate !== null &&
                    new Date() >= cycle.startDate &&
                    new Date() <= cycle.endDate,
            );
            if (!activeCycle) {
                return collaborators.map((c) => ({
                    cycle: null,
                    collaborator: c,
                    autoEvaluation: null,
                    evaluation360: null,
                    managerEvaluation: null,
                    equalization: null,
                }));
            }
            targetCycleId = activeCycle.id;
        }

        const collaboratorIds = collaborators.map((c) => c.id);

        // Buscar avaliações em lote
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: { in: collaboratorIds },
                cycleConfigId: targetCycleId,
            },
            include: {
                autoEvaluation: { include: { assignments: true } },
                evaluation360: true,
            },
        });

        // Buscar avaliações de gestor
        const managerEvaluations = await this.prisma.managerEvaluation.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: targetCycleId,
            },
            include: { criterias: true },
        });

        // Buscar equalizações
        const equalizations = await this.prisma.equalization.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: targetCycleId,
            },
        });

        // Buscar ciclo
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: targetCycleId },
        });

        // Indexa avaliações por colaborador
        const managerByCollaborator = new Map<number, number | null>();
        for (const m of managerEvaluations) {
            if (m.criterias?.length) {
                const scores = m.criterias.map((c) => c.score);
                managerByCollaborator.set(
                    m.collaboratorId,
                    Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10,
                );
            } else {
                managerByCollaborator.set(m.collaboratorId, null);
            }
        }

        const equalizationByCollaborator = new Map<number, number | null>();
        for (const eq of equalizations) {
            equalizationByCollaborator.set(eq.collaboratorId, eq.score);
        }

        // Monta resposta
        return collaborators.map((c) => {
            const evaluation = evaluations.find((ev) => ev.evaluatorId === c.id);

            // Autoavaliação
            let autoEvaluationGrade: number | null = null;
            if (evaluation?.autoEvaluation?.assignments?.length) {
                const assignments = evaluation.autoEvaluation.assignments;
                autoEvaluationGrade =
                    Math.round(
                        (assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length) *
                            10,
                    ) / 10;
            }

            // Avaliação 360
            let evaluation360Grade: number | null = null;
            if (evaluation?.evaluation360?.length) {
                const scores = evaluation.evaluation360.map((e) => e.score);
                evaluation360Grade =
                    Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
            }

            // Gestor
            const managerGrade = managerByCollaborator.get(c.id) ?? null;

            // Equalização
            const equalizationGrade = equalizationByCollaborator.get(c.id) ?? null;

            return {
                cycle: cycle
                    ? {
                          id: cycle.id,
                          name: cycle.name,
                          startDate: cycle.startDate,
                          endDate: cycle.endDate,
                      }
                    : null,
                collaborator: c,
                autoEvaluation: autoEvaluationGrade,
                evaluation360: evaluation360Grade,
                managerEvaluation: managerGrade,
                equalization: equalizationGrade,
            };
        });
    }
}
