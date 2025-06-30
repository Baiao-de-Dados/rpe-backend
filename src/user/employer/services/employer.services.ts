import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
                isActive: true,
            },
        });
        if (!active) throw new NotFoundException('Nenhum ciclo ativo');

        const daysRemaining = Math.ceil(
            (active.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        const pending = await this.prisma.evaluation.count({
            where: {
                evaluateeId: userId,
                cycleConfigId: active.id,
                status: 'PENDING',
            },
        });

        const lastCycle = await this.prisma.cycleConfig.findFirst({
            where: { isActive: false },
            orderBy: { endDate: 'desc' },
        });

        let lastAvg: number | null = null;
        if (lastCycle) {
            const evs = await this.prisma.evaluation.findMany({
                where: {
                    evaluateeId: userId,
                    cycleConfigId: lastCycle.id,
                    status: 'COMPLETED',
                },
            });
            lastAvg =
                evs.length > 0
                    ? evs.reduce((sum, e) => sum + (e.score ?? 0), 0) / evs.length
                    : null;
        }

        return {
            cycleName: active.name,
            daysRemaining,
            pendingCout: pending,
            lastCycleAvg: lastAvg,
        };
    }

    async getEvolution(userId: number, cycleConfigId?: number) {
        const filter = cycleConfigId ? { id: cycleConfigId } : {};

        const cycles = await this.prisma.cycleConfig.findMany({
            where: filter,
            orderBy: { startDate: 'asc' },
        });

        return Promise.all(
            cycles.map(async (cycle) => {
                const evs = await this.prisma.evaluation.findMany({
                    where: {
                        evaluateeId: userId,
                        cycleConfigId: cycle.id,
                        status: 'COMPLETED',
                    },
                });
                const avg =
                    evs.length > 0
                        ? evs.reduce((sum, e) => sum + (e.score ?? 0), 0) / evs.length
                        : 0;
                return { cycle: cycle.name, average: avg };
            }),
        );
    }

    async findPendingEvaluations(userId: number, cycleConfigId?: number) {
        const active = cycleConfigId
            ? await this.prisma.cycleConfig.findUnique({ where: { id: cycleConfigId } })
            : await this.prisma.cycleConfig.findFirst({ where: { isActive: true } });

        if (!active) throw new NotFoundException('Ciclo não encontrado');

        return this.prisma.evaluation.findMany({
            where: {
                evaluateeId: userId,
                cycleConfigId: active.id,
                status: 'PENDING',
            },
            select: {
                id: true,
                type: true,
                status: true,
                createdAt: true,
            },
        });
    }

    async getEvaluationData(userId: number, cycleConfigId: number) {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
            include: {
                pillarConfigs: {
                    include: {
                        pillar: {
                            include: {
                                criteria: true,
                            },
                        },
                    },
                },
            },
        });
        if (!cycle) throw new NotFoundException('Ciclo não existe');

        const autoEval = await this.prisma.evaluation.findFirst({
            where: {
                evaluateeId: userId,
                cycleConfigId,
                type: 'AUTOEVALUATION',
            },
            include: {
                CriteriaAssignment: true,
            },
        });

        const pillars = cycle.pillarConfigs.map((pc) => ({
            id: pc.pillar.id,
            name: pc.pillar.id,
            criteria: pc.pillar.criteria.map((c) => {
                const assigned = autoEval?.CriteriaAssignment.find((a) => a.criterionId === c.id);
                return {
                    criterionId: c.id,
                    title: c.name,
                    description: c.description,
                    score: assigned?.note ?? null,
                    justification: assigned?.justification ?? '',
                };
            }),
        }));

        return {
            cycleName: cycle.name,
            pillars,
            // TODO: incluir avaliacao360, mentoring e referenc aq
        };
    }

    async submitAutoEvaluation(userId: number, cycleConfigId: number, dto: AutoEvaluationDto) {
        let ev = await this.prisma.evaluation.findFirst({
            where: {
                evaluateeId: userId,
                cycleConfigId,
                type: 'AUTOEVALUATION',
            },
        });
        if (!ev) {
            ev = await this.prisma.evaluation.create({
                data: {
                    evaluateeId: userId,
                    evaluatorId: userId,
                    cycleConfigId,
                    type: 'AUTOEVALUATION',
                    status: 'IN_PROGRESS',
                    justification: 'Autoavaliação', // default
                },
            });
        }
        await Promise.all(
            dto.responses.map((r) =>
                this.prisma.criteriaAssignment.upsert({
                    where: {
                        autoEvaluationID_criterionId: {
                            autoEvaluationID: ev.id,
                            criterionId: r.questionId,
                        },
                    },
                    update: {
                        note: r.score,
                        justification: r.justification ?? '',
                    },
                    create: {
                        autoEvaluationID: ev.id,
                        criterionId: r.questionId,
                        note: r.score,
                        justification: r.justification ?? '',
                    },
                }),
            ),
        );
        const all = await this.prisma.criteriaAssignment.findMany({
            where: { autoEvaluationID: ev.id },
        });
        const avg = all.reduce((s, a) => s + a.note, 0) / all.length;

        await this.prisma.evaluation.update({
            where: { id: ev.id },
            data: { score: avg },
        });
        return { evaluationId: ev.id, average: avg };
    }

    async submit360Evaluation(userId: number, cycleConfigId: number, dto: Evaluation360Dto) {
        const cycle = await this.prisma.cycleConfig.findUnique({ where: { id: cycleConfigId } });
        if (!cycle) throw new NotFoundException('Ciclo não encontrado');

        const created = await Promise.all(
            dto.responses.map((r) =>
                this.prisma.evaluation.create({
                    data: {
                        evaluatorId: userId,
                        evaluateeId: r.employerId,
                        cycleConfigId,
                        type: 'PEER_360',
                        score: r.score,
                        justification: JSON.stringify({
                            strengths: r.strenghts,
                            improvements: r.improvements,
                        }),
                        status: 'COMPLETED',
                    },
                }),
            ),
        );
        return created;
    }

    async submitMentoring(userId: number, cycleConfigId: number, dto: MentoringDto) {
        const mentorLink = await this.prisma.userRoleLink.findFirst({
            where: { role: 'MENTOR', isActive: true },
        });
        if (!mentorLink) throw new NotFoundException('Mentor não encontrado');

        const evaluation = await this.prisma.evaluation.create({
            data: {
                evaluatorId: userId,
                evaluateeId: mentorLink.userId,
                cycleConfigId,
                type: 'MENTOR',
                score: dto.score,
                justification: dto.justification ?? '',
                status: 'COMPLETED',
            },
        });
        return evaluation;
    }

    async submitReferences(userId: number, cycleConfigId: number, dto: ReferenceDto) {
        const cycle = await this.prisma.cycleConfig.findUnique({ where: { id: cycleConfigId } });
        if (!cycle) throw new NotFoundException('Ciclo não encontrado');

        const created = await Promise.all(
            dto.references.map((r) =>
                this.prisma.reference.create({
                    data: {
                        fromId: userId,
                        toId: r.employerId,
                        comment: r.justification ?? '',
                        tags: [],
                    },
                }),
            ),
        );
        return created;
    }

    async completeEvaluation(userId: number, cycleId: number) {
        const ev = await this.prisma.evaluation.findFirst({
            where: {
                id: userId,
                cycleConfigId: cycleId,
            },
        });
        if (!ev) throw new NotFoundException();
        return this.prisma.evaluation.update({
            where: { id: ev.id },
            data: { status: 'COMPLETED', submittedAt: new Date() },
        });
    }
}
