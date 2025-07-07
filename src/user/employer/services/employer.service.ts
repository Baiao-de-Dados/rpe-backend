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
        const active = await this.prisma.cycleConfig.findFirst({ where: { isActive: true } });
        if (!active) throw new NotFoundException('Nenhum ciclo ativo');

        const daysRemaining = Math.ceil(
            (active.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        const pendingCount = await this.prisma.evaluation.count({
            where: { evaluateeId: userId, cycleConfigId: active.id, status: 'PENDING' },
        });

        const lastCycle = await this.prisma.cycleConfig.findFirst({
            where: { isActive: false },
            orderBy: { endDate: 'desc' },
        });

        let lastAvg: number | null = null;
        if (lastCycle) {
            const evalRecord = await this.prisma.evaluation.findFirst({
                where: {
                    evaluateeId: userId,
                    cycleConfigId: lastCycle.id,
                },
            });
            if (evalRecord) {
                const autoEval = await this.prisma.autoEvaluation.findUnique({
                    where: { evaluationId: evalRecord.id },
                    include: { assignments: true },
                });
                if (autoEval && autoEval.assignments.length > 0) {
                    lastAvg =
                        autoEval.assignments.reduce((sum, a) => sum + a.score, 0) /
                        autoEval.assignments.length;
                }
            }
        }

        return {
            cycleName: active.name,
            daysRemaining,
            pendingCount,
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
                let avg = 0;
                const evalRecord = await this.prisma.evaluation.findFirst({
                    where: {
                        evaluateeId: userId,
                        cycleConfigId: cycle.id,
                        status: 'COMPLETED',
                    },
                });
                if (evalRecord) {
                    const autoEval = await this.prisma.autoEvaluation.findUnique({
                        where: { evaluationId: evalRecord.id },
                        include: { assignments: true },
                    });
                    if (autoEval && autoEval.assignments.length > 0) {
                        avg =
                            autoEval.assignments.reduce((sum, a) => sum + a.score, 0) /
                            autoEval.assignments.length;
                    }
                }
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
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async getEvaluationData(userId: number, cycleConfigId: number) {
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleConfigId },
        });
        if (!cycle) throw new NotFoundException('Ciclo não existe');

        const evalRecord = await this.prisma.evaluation.findFirst({
            where: { evaluateeId: userId, cycleConfigId },
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
                evaluateeId: userId,
                cycleConfigId,
            },
        });
        if (!evalRecord) {
            evalRecord = await this.prisma.evaluation.create({
                data: {
                    evaluateeId: userId,
                    evaluatorId: userId,
                    cycleConfigId,
                    status: 'PENDING',
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

        const average = assignments.reduce((sum, a) => sum + a.score, 0) | assignments.length;

        await this.prisma.evaluation.update({
            where: { id: evalRecord.id },
            data: { status: 'COMPLETED' },
        });

        return { evaluationId: evalRecord.id, average };
    }

    async submit360Evaluation(userId: number, cycleConfigId: number, dto: Evaluation360Dto) {
        const results = await Promise.all(
            dto.responses.map(async (r) => {
                const evalRecord = await this.prisma.evaluation.create({
                    data: {
                        evaluatorId: userId,
                        evaluateeId: r.evaluateeId,
                        cycleConfigId,
                        status: 'COMPLETED',
                    },
                });
                return this.prisma.evaluation360.create({
                    data: {
                        evaluationId: evalRecord.id,
                        justification: r.justification,
                        score: r.score,
                        strengths: r.strenghts,
                        improvements: r.improvements,
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
                evaluateeId: dto.menteeId,
                cycleConfigId,
                status: 'COMPLETED',
            },
        });
        return this.prisma.mentoring.create({
            data: {
                evaluationId: evalRecord.id,
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
                        evaluateeId: r.evaluateeId,
                        cycleConfigId,
                        status: 'COMPLETED',
                    },
                });
                return this.prisma.reference.create({
                    data: {
                        evaluationId: evalRecord.id,
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
                evaluateeId: userId,
                cycleConfigId,
            },
        });
        if (!evalRecord) throw new NotFoundException('Avaliação não encontrada');
        return this.prisma.evaluation.update({
            where: { id: evalRecord.id },
            data: { status: 'COMPLETED' },
        });
    }
}
