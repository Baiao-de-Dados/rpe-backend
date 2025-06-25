import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SystemConfigService } from '../../../common/services/system-config.service';
import {
    DashboardStatsDto,
    CollaboratorsStatusDto,
    CollaboratorStatusDto,
    RoleCompletionStatsDto,
} from '../dto/dashboard-stats.dto';

@Injectable()
export class RhPanelService {
    constructor(
        private prisma: PrismaService,
        private systemConfigService: SystemConfigService,
    ) {}

    async getDashboardStats(currentCycle?: string): Promise<DashboardStatsDto> {
        // Se não foi fornecido um ciclo atual, usar o configurado no sistema
        let targetCycle = currentCycle;
        if (!targetCycle) {
            targetCycle = await this.systemConfigService.getCurrentCycle();
        }

        // Se ainda não há ciclo configurado, usar o mais recente das avaliações existentes
        if (targetCycle === 'N/A') {
            const latestEvaluation = await this.prisma.evaluation.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { cycle: true },
            });
            targetCycle = latestEvaluation?.cycle || 'N/A';
        }

        // Buscar APENAS as avaliações do ciclo atual com seus usuários
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycle: targetCycle },
            include: {
                user: true,
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                references: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calcular estatísticas APENAS para as avaliações do ciclo atual
        const totalEvaluations = evaluations.length;
        const completedEvaluations = evaluations.filter((evaluation) => {
            return !!(
                evaluation.autoEvaluation ||
                evaluation.evaluation360 ||
                evaluation.mentoring ||
                evaluation.references
            );
        }).length;

        const pendingEvaluations = totalEvaluations - completedEvaluations;
        const completionPercentage =
            totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0;

        // Detalhar por tipo de avaliação
        const autoEvaluationCount = evaluations.filter(
            (evaluation) => evaluation.autoEvaluation,
        ).length;
        const evaluation360Count = evaluations.filter(
            (evaluation) => evaluation.evaluation360,
        ).length;
        const mentoringCount = evaluations.filter((evaluation) => evaluation.mentoring).length;
        const referencesCount = evaluations.filter((evaluation) => evaluation.references).length;

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
                    mentoring: mentoringCount,
                    references: referencesCount,
                },
                cycleEndDate: this.getCycleEndDate(targetCycle),
            },
            currentCycle: targetCycle,
            lastUpdated: new Date().toISOString(),
        };
    }

    //retorna o status de todos os colaboradores
    async getCollaboratorsStatus(): Promise<CollaboratorsStatusDto> {
        // Obter o ciclo atual
        const currentCycle = await this.systemConfigService.getCurrentCycle();
        let targetCycle = currentCycle;

        if (targetCycle === 'N/A') {
            const latestEvaluation = await this.prisma.evaluation.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { cycle: true },
            });
            targetCycle = latestEvaluation?.cycle || 'N/A';
        }

        // Buscar APENAS as avaliações do ciclo atual com seus usuários
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycle: targetCycle },
            include: {
                user: true,
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                references: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const collaborators = evaluations.map((evaluation) => {
            const isCompleted = !!(
                evaluation.autoEvaluation ||
                evaluation.evaluation360 ||
                evaluation.mentoring ||
                evaluation.references
            );

            return {
                id: evaluation.user.id,
                name: evaluation.user.name || 'Sem nome',
                email: evaluation.user.email,
                cycle: evaluation.cycle,
                status: isCompleted ? ('finalizado' as const) : ('pendente' as const),
                breakdown: {
                    autoEvaluation: !!evaluation.autoEvaluation,
                    evaluation360: !!evaluation.evaluation360,
                    mentoring: !!evaluation.mentoring,
                    references: !!evaluation.references,
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
        const currentCycle = await this.systemConfigService.getCurrentCycle();
        let targetCycle = currentCycle;

        if (targetCycle === 'N/A') {
            const latestEvaluation = await this.prisma.evaluation.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { cycle: true },
            });
            targetCycle = latestEvaluation?.cycle || 'N/A';
        }

        // Buscar APENAS a avaliação do usuário no ciclo atual
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                userId: collaboratorId,
                cycle: targetCycle,
            },
            include: {
                user: true,
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                references: true,
            },
        });

        if (!evaluation) {
            throw new NotFoundException(
                `Avaliação do usuário ${collaboratorId} no ciclo ${targetCycle} não encontrada`,
            );
        }

        const isCompleted = !!(
            evaluation.autoEvaluation ||
            evaluation.evaluation360 ||
            evaluation.mentoring ||
            evaluation.references
        );

        return {
            id: evaluation.user.id,
            name: evaluation.user.name || 'Sem nome',
            email: evaluation.user.email,
            cycle: evaluation.cycle,
            status: isCompleted ? ('finalizado' as const) : ('pendente' as const),
            breakdown: {
                autoEvaluation: !!evaluation.autoEvaluation,
                evaluation360: !!evaluation.evaluation360,
                mentoring: !!evaluation.mentoring,
                references: !!evaluation.references,
            },
            createdAt: evaluation.createdAt.toISOString(),
        };
    }

    //retorna as estatísticas de completude das roles
    async getRoleCompletionStats(): Promise<RoleCompletionStatsDto> {
        // Obter o ciclo atual
        const currentCycle = await this.systemConfigService.getCurrentCycle();
        let targetCycle = currentCycle;

        if (targetCycle === 'N/A') {
            const latestEvaluation = await this.prisma.evaluation.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { cycle: true },
            });
            targetCycle = latestEvaluation?.cycle || 'N/A';
        }

        // Buscar APENAS as avaliações do ciclo atual com seus usuários e roles
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycle: targetCycle },
            include: {
                user: {
                    include: {
                        userRoles: {
                            where: { isActive: true },
                            select: { role: true },
                        },
                    },
                },
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                references: true,
            },
        });

        const roleStats = new Map<string, { total: number; completed: number; pending: number }>();

        evaluations.forEach((evaluation) => {
            const userRoles = evaluation.user.userRoles.map((ur) => ur.role);

            if (userRoles.length === 0) return;

            const hasCompletedEvaluation = !!(
                evaluation.autoEvaluation ||
                evaluation.evaluation360 ||
                evaluation.mentoring ||
                evaluation.references
            );

            userRoles.forEach((role) => {
                const current = roleStats.get(role) || { total: 0, completed: 0, pending: 0 };
                current.total += 1;

                if (hasCompletedEvaluation) {
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
