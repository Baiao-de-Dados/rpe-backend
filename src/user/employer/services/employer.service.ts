import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AutoEvaluationDto } from '../dto/auto-evaluation.dto';
import { Evaluation360Dto } from '../dto/evaluation-360.dto';
import { MentoringDto } from '../dto/mentoring.dto';
import { ReferenceDto } from '../dto/references.dto';
import { getBrazilDate } from 'src/cycles/utils';

@Injectable()
export class EmployerService {
    constructor(private readonly prisma: PrismaService) {}

    async getDashboard(userId: number) {
        const active = (await this.prisma.cycleConfig.findMany()).find(
            (cycle) =>
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                new Date(getBrazilDate()) >= cycle.startDate &&
                new Date(getBrazilDate()) <= cycle.endDate,
        );
        if (!active) throw new NotFoundException('Nenhum ciclo ativo');

        const daysRemaining = active.endDate
            ? Math.ceil(
                  (active.endDate.getTime() - getBrazilDate().getTime()) / (1000 * 60 * 60 * 24),
              )
            : null;

        const pendingCount = await this.prisma.evaluation.count({
            where: { evaluatorId: userId, cycleConfigId: active.id },
        });

        const lastCycle = await this.prisma.cycleConfig.findFirst({
            where: { done: true },
            orderBy: { endDate: 'desc' },
        });

        let lastEvaluation: { average: number } | null = null;
        if (lastCycle) {
            const evalRecord = await this.prisma.evaluation.findFirst({
                where: {
                    evaluatorId: userId,
                    cycleConfigId: lastCycle.id,
                },
            });

            if (evalRecord) {
                const autoEvaluation = await this.prisma.autoEvaluation.findUnique({
                    where: { evaluationId: evalRecord.id },
                    include: { assignments: true },
                });

                if (autoEvaluation && autoEvaluation.assignments.length > 0) {
                    const average =
                        autoEvaluation.assignments.reduce((sum, a) => sum + a.score, 0) /
                        autoEvaluation.assignments.length;
                    lastEvaluation = { average };
                }
            }
        }

        return {
            activeCycle: active,
            pendingCount,
            lastEvaluation,
            daysRemaining,
        };
    }

    async getEvolution(userId: number, cycleConfigId?: number) {
        const filter = cycleConfigId ? { id: cycleConfigId } : {};
        const cycles = await this.prisma.cycleConfig.findMany({ where: filter });

        const evolution = await Promise.all(
            cycles.map(async (cycle) => {
                const evalRecord = await this.prisma.evaluation.findFirst({
                    where: {
                        evaluatorId: userId,
                        cycleConfigId: cycle.id,
                    },
                });

                return {
                    cycleId: cycle.id,
                    cycleName: cycle.name,
                    cycleStartDate: cycle.startDate,
                    cycleEndDate: cycle.endDate,
                    hasEvaluation: !!evalRecord,
                };
            }),
        );

        return evolution;
    }

    async findPendingEvaluations(userId: number, cycleConfigId?: number) {
        const active = cycleConfigId
            ? await this.prisma.cycleConfig.findUnique({ where: { id: cycleConfigId } })
            : (await this.prisma.cycleConfig.findMany()).find(
                  (cycle) =>
                      !cycle.done &&
                      cycle.startDate !== null &&
                      cycle.endDate !== null &&
                      new Date(getBrazilDate()) >= cycle.startDate &&
                      new Date(getBrazilDate()) <= cycle.endDate,
              );

        if (!active) throw new NotFoundException('Ciclo não encontrado');

        // Buscar avaliações pendentes do usuário
        const pendingEvaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: userId,
                cycleConfigId: active.id,
            },
        });

        return pendingEvaluations;
    }

    async getEvaluationData(userId: number, cycleConfigId: number) {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
        });
        if (!cycle) throw new NotFoundException('Ciclo não existe');

        const evalRecord = await this.prisma.evaluation.findFirst({
            where: { evaluatorId: userId, cycleConfigId },
        });
        if (!evalRecord) throw new NotFoundException('Avaliação não encontrada');

        const criteria = await this.prisma.criterionTrackCycleConfig.findMany({
            where: { cycleId: cycleConfigId },
            include: {
                criterion: {
                    include: { pillar: true },
                },
            },
        });

        // Agrupar por pilar
        const pillarsMap = new Map();
        criteria.forEach((config) => {
            const pillar = config.criterion.pillar;
            const criterion = config.criterion;
            if (!pillarsMap.has(pillar.id)) {
                pillarsMap.set(pillar.id, {
                    id: pillar.id,
                    name: pillar.name,
                    criteria: [],
                });
            }
            const pillarData = pillarsMap.get(pillar.id);
            pillarData.criteria.push({
                id: criterion.id,
                name: criterion.name,
                description: criterion.description,
                weight: config.weight,
            });
        });

        const pillars = Array.from(pillarsMap.values());

        return {
            cycleName: cycle.name,
            pillars,
            // TODO: incluir avaliacao360, mentoring e referencias
        };
    }

    async submitAutoEvaluation(userId: number, cycleConfigId: number, dto: AutoEvaluationDto) {
        let evalRecord = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: userId,
                cycleConfigId,
            },
        });
        if (!evalRecord) {
            evalRecord = await this.prisma.evaluation.create({
                data: {
                    evaluatorId: userId,
                    cycleConfigId,
                },
            });
            await this.prisma.autoEvaluation.create({
                data: { evaluationId: evalRecord.id },
            });
        }

        await Promise.all(
            dto.responses.map((r) =>
                this.prisma.autoEvaluationAssignment.upsert({
                    where: {
                        evaluationId_criterionId: {
                            evaluationId: evalRecord.id,
                            criterionId: r.criterionId,
                        },
                    },
                    update: {
                        score: r.score,
                        justification: r.justification ?? '',
                    },
                    create: {
                        evaluationId: evalRecord.id,
                        criterionId: r.criterionId,
                        score: r.score,
                        justification: r.justification ?? '',
                    },
                }),
            ),
        );
        const assignments = await this.prisma.autoEvaluationAssignment.findMany({
            where: { evaluationId: evalRecord.id },
        });

        const average = assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length;

        return { evaluationId: evalRecord.id, average };
    }

    async submit360Evaluation(userId: number, cycleConfigId: number, dto: Evaluation360Dto) {
        const results = await Promise.all(
            dto.responses.map(async (r) => {
                const evalRecord = await this.prisma.evaluation.create({
                    data: {
                        evaluatorId: userId,
                        cycleConfigId,
                    },
                });
                return this.prisma.evaluation360.create({
                    data: {
                        evaluationId: evalRecord.id,
                        evaluatedId: r.evaluateeId,
                        score: r.score,
                        strengths: r.strenghts ?? '',
                        improvements: r.improvements ?? '',
                    },
                });
            }),
        );
        return results;
    }

    async submitMentoring(userId: number, cycleConfigId: number, dto: MentoringDto) {
        const evalRecord = await this.prisma.evaluation.create({
            data: {
                evaluatorId: userId,
                cycleConfigId,
            },
        });
        return this.prisma.mentoring.create({
            data: {
                evaluationId: evalRecord.id,
                mentorId: dto.menteeId,
                justification: dto.justification ?? '',
                score: dto.score,
            },
        });
    }

    async submitReferences(userId: number, cycleConfigId: number, dto: ReferenceDto) {
        const results = await Promise.all(
            dto.references.map(async (r) => {
                const evalRecord = await this.prisma.evaluation.create({
                    data: {
                        evaluatorId: userId,
                        cycleConfigId,
                    },
                });
                return this.prisma.reference.create({
                    data: {
                        evaluationId: evalRecord.id,
                        collaboratorId: r.evaluateeId,
                        justification: r.justification ?? '',
                    },
                });
            }),
        );
        return results;
    }

    async completeEvaluation(userId: number, cycleConfigId: number) {
        const evalRecord = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: userId,
                cycleConfigId,
            },
        });
        if (!evalRecord) throw new NotFoundException('Avaliação não encontrada');

        return { message: 'Avaliação completada com sucesso' };
    }

    async getEvaluationResultForCycle(userId: number, cycleConfigId: number) {
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: userId,
                cycleConfigId,
            },
            include: {
                evaluator: { include: { track: true } },
                autoEvaluation: { include: { assignments: { include: { criterion: true } } } },
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
        });
        if (!evaluation) {
            throw new NotFoundException('Nenhuma avaliação encontrada para este ciclo.');
        }
        return {
            id: evaluation.id,
            cycleConfigId: evaluation.cycleConfigId,
            userId: evaluation.evaluatorId,
            sentDate: evaluation.createdAt,
            user: evaluation.evaluator
                ? {
                      id: evaluation.evaluator.id,
                      name: evaluation.evaluator.name,
                      track: evaluation.evaluator.track?.name ?? null,
                  }
                : null,
            autoEvaluation: evaluation.autoEvaluation
                ? {
                      pilares: this.formatAutoEvaluationPilares(
                          evaluation.autoEvaluation.assignments,
                      ),
                  }
                : null,
            evaluation360: evaluation.evaluation360.map((ev) => ({
                avaliadoId: ev.evaluatedId,
                pontosFortes: ev.strengths,
                pontosMelhoria: ev.improvements,
                score: ev.score,
            })),
            mentoring: evaluation.mentoring
                ? {
                      mentorId: evaluation.mentoring.mentorId,
                      justificativa: evaluation.mentoring.justification,
                      score: evaluation.mentoring.score,
                  }
                : null,
            reference: evaluation.reference.map((ref) => ({
                colaboradorId: ref.collaboratorId,
                justificativa: ref.justification,
            })),
        };
    }

    async getAllGradesForCycle(
        userId: number,
        cycleConfigId: number,
    ): Promise<{
        autoEvaluation: number | null;
        evaluation360: number | null;
        manager: number | null;
        committee: number | null;
    }> {
        // Autoavaliação
        const evaluation = await this.prisma.evaluation.findFirst({
            where: { evaluatorId: userId, cycleConfigId },
            include: {
                autoEvaluation: { include: { assignments: true } },
                evaluation360: true,
            },
        });
        // Nota da autoavaliação
        let autoEvaluationGrade: number | null = null;
        if (evaluation?.autoEvaluation?.assignments?.length) {
            const assignments = evaluation.autoEvaluation.assignments;
            autoEvaluationGrade =
                Math.round(
                    (assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length) * 10,
                ) / 10;
        }
        // Nota da avaliação 360 (média das notas recebidas)
        let evaluation360Grade: number | null = null;
        if (evaluation?.evaluation360?.length) {
            const scores = evaluation.evaluation360.map((ev) => ev.score);
            evaluation360Grade =
                Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
        }
        // Nota do gestor
        let managerGrade: number | null = null;
        const managerEvaluation = await this.prisma.managerEvaluation.findFirst({
            where: { collaboratorId: userId, cycleId: cycleConfigId },
            include: { criterias: true },
        });
        if (managerEvaluation?.criterias?.length) {
            const scores = managerEvaluation.criterias.map((c) => c.score);
            managerGrade =
                Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
        }
        // Nota do comitê (equalização)
        let committeeGrade: number | null = null;
        const equalization = await this.prisma.equalization.findFirst({
            where: { collaboratorId: userId, cycleId: cycleConfigId },
        });
        if (equalization?.score !== undefined && equalization?.score !== null) {
            committeeGrade = Math.round(equalization.score * 10) / 10;
        }
        return {
            autoEvaluation: autoEvaluationGrade,
            evaluation360: evaluation360Grade,
            manager: managerGrade,
            committee: committeeGrade,
        };
    }

    async getAllEvaluationsForUser(userId: number) {
        // Busca todas as avaliações do usuário
        const evaluations = await this.prisma.evaluation.findMany({
            where: { evaluatorId: userId },
            include: {
                cycleConfig: true,
                autoEvaluation: { include: { assignments: true } },
                evaluation360: true,
            },
            orderBy: { cycleConfigId: 'asc' },
        });
        // Busca todas as avaliações de gestor para o usuário
        const managerEvaluations = await this.prisma.managerEvaluation.findMany({
            where: { collaboratorId: userId },
            include: { criterias: true },
        });
        // Indexa avaliações de gestor por ciclo
        const managerByCycle = new Map<number, number | null>();
        for (const m of managerEvaluations) {
            if (m.criterias?.length) {
                const scores = m.criterias.map((c) => c.score);
                managerByCycle.set(
                    m.cycleId,
                    Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10,
                );
            } else {
                managerByCycle.set(m.cycleId, null);
            }
        }
        // Monta resposta
        const result = await Promise.all(
            evaluations.map(async (ev) => {
                // Autoavaliação
                let autoEvaluationGrade: number | null = null;
                if (ev.autoEvaluation?.assignments?.length) {
                    const assignments = ev.autoEvaluation.assignments;
                    autoEvaluationGrade =
                        Math.round(
                            (assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length) *
                                10,
                        ) / 10;
                }
                // 360
                let evaluation360Grade: number | null = null;
                if (ev.evaluation360?.length) {
                    const scores = ev.evaluation360.map((e) => e.score);
                    evaluation360Grade =
                        Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
                }
                // Comitê
                let committeeGrade: number | null = null;
                const equalization = await this.prisma.equalization.findFirst({
                    where: { collaboratorId: userId, cycleId: ev.cycleConfigId },
                });
                if (equalization?.score !== undefined && equalization?.score !== null) {
                    committeeGrade = Math.round(equalization.score * 10) / 10;
                }
                // Gestor
                const managerGrade = managerByCycle.get(ev.cycleConfigId) ?? null;
                return {
                    cycle: {
                        id: ev.cycleConfig.id,
                        name: ev.cycleConfig.name,
                        startDate: ev.cycleConfig.startDate,
                        endDate: ev.cycleConfig.endDate,
                    },
                    autoEvaluation: autoEvaluationGrade,
                    evaluation360: evaluation360Grade,
                    manager: managerGrade,
                    committee: committeeGrade,
                };
            }),
        );
        return result;
    }

    async getUserNetwork(userId: number) {
        // 1. Buscar todos os usuários do mesmo projeto
        const projectMemberships = await this.prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });
        const projectIds = projectMemberships.map((pm) => pm.projectId);
        const projectMembers = await this.prisma.projectMember.findMany({
            where: { projectId: { in: projectIds } },
            select: { userId: true },
        });
        const sameProjectUserIds = Array.from(
            new Set(projectMembers.map((pm) => pm.userId)),
        ).filter((id) => id !== userId);
        const sameProjectUsers = await this.prisma.user.findMany({
            where: {
                id: { in: sameProjectUserIds },
                userRoles: {
                    some: { role: 'EMPLOYER' },
                },
            },
            select: { id: true, name: true, email: true, position: true },
        });

        // 2. Buscar mentor do usuário
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        let mentor: any = null;
        if (user?.mentorId) {
            mentor = await this.prisma.user.findUnique({
                where: { id: user.mentorId },
                select: { id: true, name: true, email: true, position: true },
            });
        }

        return {
            sameProjectUsers,
            mentor,
        };
    }

    private formatAutoEvaluationPilares(assignments: any[]) {
        const pilaresMap = new Map();
        for (const a of assignments) {
            if (!pilaresMap.has(a.criterion.pillarId)) {
                pilaresMap.set(a.criterion.pillarId, {
                    pilarId: a.criterion.pillarId,
                    criterios: [],
                });
            }
            pilaresMap.get(a.criterion.pillarId).criterios.push({
                criterioId: a.criterionId,
                nota: a.score,
                justificativa: a.justification,
            });
        }
        return Array.from(pilaresMap.values());
    }
}
