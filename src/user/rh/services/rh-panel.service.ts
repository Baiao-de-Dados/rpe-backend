import { CollaboratorsStatusDto, CollaboratorStatusDto } from '../dto/collaborator.dashboard.dto';
import { SystemConfigService } from '../../../common/services/system-config.service';
import { RoleCompletionStatsDto } from '../dto/roles.dashboard.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';
import { EvaluationType } from '@prisma/client';

@Injectable()
export class RhPanelService {
    constructor(
        private prisma: PrismaService,
        private systemConfigService: SystemConfigService,
    ) {}

    async getDashboardStats(currentCycle?: string): Promise<DashboardStatsDto> {
        let targetCycle = currentCycle;

        if (!targetCycle) {
            targetCycle = this.systemConfigService.getCurrentCycle();
        }

        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycle: parseInt(targetCycle, 10) },
            include: {
                evaluator: true,
                evaluatee: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalEvaluations = evaluations.length;
        const completedEvaluations = evaluations.filter((evaluation) => {
            return (
                evaluation.type === EvaluationType.AUTOEVALUATION ||
                evaluation.type === EvaluationType.PEER_360 ||
                evaluation.type === EvaluationType.MENTOR
            );
        }).length;

        const pendingEvaluations = totalEvaluations - completedEvaluations;
        const completionPercentage =
            totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0;

        const autoEvaluationCount = evaluations.filter(
            (evaluation) => evaluation.type === EvaluationType.AUTOEVALUATION,
        ).length;
        const evaluation360Count = evaluations.filter(
            (evaluation) => evaluation.type === EvaluationType.PEER_360,
        ).length;

        return {
            overall: {
                totalEvaluations,
                totalCompleted: completedEvaluations,
                totalPending: pendingEvaluations,
                completionPercentage,
            },
            cycle: {
                cycle: targetCycle,
                totalEvaluations,
                completedEvaluations,
                pendingEvaluations,
                completionPercentage,
                breakdown: {
                    autoEvaluation: autoEvaluationCount,
                    evaluation360: evaluation360Count,
                    mentoring: 0,
                    references: 0,
                },
                cycleEndDate: this.getCycleEndDate(targetCycle),
            },
            currentCycle: targetCycle,
            lastUpdated: new Date().toISOString(),
        };
    }

    async getCollaboratorsStatus(): Promise<CollaboratorsStatusDto> {
        // Obter o ciclo atual
        const currentCycle = this.systemConfigService.getCurrentCycle();
        let targetCycle = currentCycle;

        if (targetCycle === 'N/A') {
            const latestEvaluation = await this.prisma.evaluation.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { cycle: true },
            });
            targetCycle = latestEvaluation?.cycle?.toString() || 'N/A';
        }

        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycle: parseInt(targetCycle, 10) },
            include: {
                evaluator: true,
                evaluatee: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const collaborators = evaluations.map((evaluation) => {
            const isCompleted =
                evaluation.type === EvaluationType.AUTOEVALUATION ||
                evaluation.type === EvaluationType.PEER_360 ||
                evaluation.type === EvaluationType.MENTOR;

            return {
                id: evaluation.evaluatee.id,
                name: evaluation.evaluatee.name || 'Sem nome',
                email: evaluation.evaluatee.email,
                cycle: evaluation.cycle.toString(),
                status: isCompleted ? ('finalizado' as const) : ('pendente' as const),
                breakdown: {
                    autoEvaluation: evaluation.type === EvaluationType.AUTOEVALUATION,
                    evaluation360: evaluation.type === EvaluationType.PEER_360,
                    mentoring: false, // Ajustar depois
                    references: false,
                },
                createdAt: evaluation.createdAt.toISOString(),
            };
        });

        const total = collaborators.length;
        const completed = collaborators.filter((c) => c.status === 'finalizado').length;
        const pending = total - completed;

        return {
            collaborators,
            total,
            completed,
            pending,
        };
    }

    //retorna o status de um colaborador específico
    async getCollaboratorStatusById(collaboratorId: number): Promise<CollaboratorStatusDto> {
        // Obter o ciclo atual
        const currentCycle = this.systemConfigService.getCurrentCycle();
        let targetCycle = currentCycle;

        if (targetCycle === 'N/A') {
            const latestEvaluation = await this.prisma.evaluation.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { cycle: true },
            });
            targetCycle = latestEvaluation?.cycle?.toString() || 'N/A';
        }

        // Buscar APENAS a avaliação do usuário no ciclo atual
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluateeId: collaboratorId,
                cycle: parseInt(targetCycle, 10),
            },
            include: {
                evaluator: true,
                evaluatee: true,
            },
        });

        if (!evaluation) {
            throw new NotFoundException(
                `Avaliação do usuário ${collaboratorId} no ciclo ${targetCycle} não encontrada`,
            );
        }

        const isCompleted =
            evaluation.type === EvaluationType.AUTOEVALUATION ||
            evaluation.type === EvaluationType.PEER_360 ||
            evaluation.type === EvaluationType.MENTOR;

        return {
            id: evaluation.evaluatee.id,
            name: evaluation.evaluatee.name || 'Sem nome',
            email: evaluation.evaluatee.email,
            cycle: evaluation.cycle.toString(),
            status: isCompleted ? ('finalizado' as const) : ('pendente' as const),
            breakdown: {
                autoEvaluation: evaluation.type === EvaluationType.AUTOEVALUATION,
                evaluation360: evaluation.type === EvaluationType.PEER_360,
                mentoring: false,
                references: false,
            },
            createdAt: evaluation.createdAt.toISOString(),
        };
    }

    // retorna as estatísticas de completude das roles
    async getRoleCompletionStats(): Promise<RoleCompletionStatsDto> {
        const currentCycle = this.systemConfigService.getCurrentCycle();
        let targetCycle = currentCycle;

        if (targetCycle === 'N/A') {
            const latestEvaluation = await this.prisma.evaluation.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { cycle: true },
            });
            targetCycle = latestEvaluation?.cycle?.toString() || 'N/A';
        }

        // Buscar APENAS as avaliações do ciclo atual com seus usuários e roles
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycle: parseInt(targetCycle, 10) },
            include: {
                evaluatee: {
                    include: {
                        userRoles: {
                            where: { isActive: true },
                            select: { role: true },
                        },
                    },
                },
            },
        });

        const roleStats = new Map<string, { total: number; completed: number; pending: number }>();

        evaluations.forEach((evaluation) => {
            const userRoles = evaluation.evaluatee.userRoles.map((ur) => ur.role);

            if (userRoles.length === 0) return;

            const isCompleted =
                evaluation.type === EvaluationType.AUTOEVALUATION ||
                evaluation.type === EvaluationType.PEER_360 ||
                evaluation.type === EvaluationType.MENTOR;

            userRoles.forEach((role) => {
                const current = roleStats.get(role) || { total: 0, completed: 0, pending: 0 };
                current.total += 1;

                if (isCompleted) {
                    current.completed += 1;
                } else {
                    current.pending += 1;
                }

                roleStats.set(role, current);
            });
        });

        // Converter para array de DTOs
        const roles = Array.from(roleStats.entries()).map(([role, stats]) => ({
            role,
            totalUsers: stats.total,
            completedUsers: stats.completed,
            pendingUsers: stats.pending,
            completionPercentage:
                stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        }));

        return {
            roles,
            lastUpdated: new Date().toISOString(),
        };
    }

    private getCycleEndDate(cycle: string): string {
        // Assumindo que o ciclo está no formato "YYYY-MM" ou similar
        try {
            const [year, month] = cycle.split('-');
            if (year && month) {
                const lastDay = new Date(parseInt(year), parseInt(month), 0);
                return lastDay.toISOString().split('T')[0];
            }
        } catch {
            //retorna uma data padrão
        }
        return 'N/A';
    }
}
