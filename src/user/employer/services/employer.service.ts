import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AutoEvaluationDto } from '../dto/auto-evaluation.dto';
import { Evaluation360Dto } from '../dto/evaluation-360.dto';
import { MentoringDto } from '../dto/mentoring.dto';
import { ReferenceDto } from '../dto/references.dto';

@Injectable()
export class EmployerService {
    constructor(private readonly prisma: PrismaService) {}

    async getDashboard(userId: number) {
        const active = await this.prisma.cycleConfig.findFirst({
            where: {
                done: false,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
            },
        });

        if (!active) throw new NotFoundException('Ciclo ativo não encontrado');

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
            : await this.prisma.cycleConfig.findFirst({
                  where: {
                      done: false,
                      startDate: { lte: new Date() },
                      endDate: { gte: new Date() },
                  },
              });

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
