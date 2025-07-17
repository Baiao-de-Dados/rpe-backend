import { CollaboratorsStatusDto, CollaboratorStatusDto } from '../dto/collaborator.dashboard.dto';
import { SystemConfigService } from '../../../common/services/system-config.service';
import { RoleCompletionStatsDto } from '../dto/roles.dashboard.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';
import { getBrazilDate } from 'src/cycles/utils';

@Injectable()
export class RhPanelService {
    constructor(
        private prisma: PrismaService,
        private systemConfigService: SystemConfigService,
    ) {}

    async getDashboardStats(currentCycle?: string | number): Promise<DashboardStatsDto> {
        let targetCycle = currentCycle;
        let cycleConfig;

        if (!targetCycle) {
            targetCycle = this.systemConfigService.getCurrentCycle();
        }

        if (
            typeof targetCycle === 'number' ||
            (typeof targetCycle === 'string' && /^\d+$/.test(targetCycle))
        ) {
            // Buscar por id
            const cycleId = Number(targetCycle);
            cycleConfig = await this.prisma.cycleConfig.findUnique({
                where: { id: cycleId },
                select: { id: true, name: true },
            });
            if (!cycleConfig) {
                throw new NotFoundException(`Ciclo com id '${cycleId}' não encontrado`);
            }
        } else {
            // Buscar por nome
            cycleConfig = await this.prisma.cycleConfig.findFirst({
                where: { name: targetCycle },
                select: { id: true, name: true },
            });
            if (!cycleConfig) {
                throw new NotFoundException(`Ciclo '${targetCycle}' não encontrado`);
            }
        }

        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycleConfigId: cycleConfig.id },
            include: {
                evaluator: true,
                autoEvaluation: {
                    include: { assignments: true },
                },
                evaluation360: true,
                mentoring: true,
                reference: true,
                cycleConfig: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalEvaluations = evaluations.length;
        const completedEvaluations = evaluations.filter(
            (evaluation) =>
                evaluation.autoEvaluation ||
                evaluation.evaluation360 ||
                evaluation.mentoring ||
                evaluation.reference,
        );

        const pendingEvaluations = totalEvaluations - completedEvaluations.length;
        const completionPercentage =
            totalEvaluations > 0
                ? Math.round((completedEvaluations.length / totalEvaluations) * 100)
                : 0;

        const autoEvaluationCount = completedEvaluations.filter(
            (evaluation) => evaluation.autoEvaluation,
        ).length;

        const evaluation360Count = completedEvaluations.filter(
            (evaluation) => evaluation.evaluation360,
        ).length;

        return {
            overall: {
                totalEvaluations,
                totalCompleted: completedEvaluations.length,
                totalPending: pendingEvaluations,
                completionPercentage,
            },
            cycle: {
                CycleConfigId: cycleConfig.id,
                totalEvaluations,
                completedEvaluations: completedEvaluations.length,
                pendingEvaluations,
                completionPercentage,
                breakdown: {
                    autoEvaluation: autoEvaluationCount,
                    evaluation360: evaluation360Count,
                    mentoring: 0,
                    references: 0,
                },
                cycleEndDate: this.getCycleEndDate(cycleConfig.name),
            },
            currentCycle: cycleConfig.name,
            lastUpdated: new Date(getBrazilDate()).toISOString(),
        };
    }

    async getCollaboratorsStatus(): Promise<CollaboratorsStatusDto> {
        // Buscar ciclo ativo diretamente
        const cycleConfig = (
            await this.prisma.cycleConfig.findMany({
                select: { id: true, name: true, startDate: true, endDate: true, done: true },
            })
        ).find(
            (cycle) =>
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                new Date(getBrazilDate()) >= cycle.startDate &&
                new Date(getBrazilDate()) <= cycle.endDate,
        );
        if (!cycleConfig) {
            throw new NotFoundException('Nenhum ciclo ativo encontrado');
        }

        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycleConfigId: cycleConfig.id },
            include: {
                evaluator: true,
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const collaboratorMap = new Map<number, any>();
        for (const ev of evaluations) {
            const isCompleted =
                ev.autoEvaluation || ev.evaluation360 || ev.mentoring || ev.reference;

            collaboratorMap.set(ev.evaluator.id, {
                id: ev.evaluator.id,
                name: ev.evaluator.name || 'Sem nome',
                email: ev.evaluator.email,
                CycleConfigId: cycleConfig.id.toString(),
                status: isCompleted ? 'finalizado' : 'pendente',
                breakdown: {
                    autoEvaluation: !!ev.autoEvaluation,
                    evaluation360: !!ev.evaluation360,
                    mentoring: !!ev.mentoring,
                    references: !!ev.reference,
                },
                createdAt: ev.createdAt.toISOString(),
            });
        }
        const collaborators = Array.from(collaboratorMap.values());

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

    async getCollaboratorStatusById(collaboratorId: number): Promise<CollaboratorStatusDto> {
        // Buscar ciclo ativo diretamente
        const cycleConfig = (
            await this.prisma.cycleConfig.findMany({
                select: { id: true, name: true, startDate: true, endDate: true, done: true },
            })
        ).find(
            (cycle) =>
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                new Date(getBrazilDate()) >= cycle.startDate &&
                new Date(getBrazilDate()) <= cycle.endDate,
        );
        if (!cycleConfig) {
            throw new NotFoundException('Nenhum ciclo ativo encontrado');
        }

        // Buscar APENAS a avaliação do usuário no ciclo ativo
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: collaboratorId,
                cycleConfigId: cycleConfig.id,
            },
            include: {
                evaluator: true,
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
        });

        if (!evaluation) {
            throw new NotFoundException(
                `Avaliação do usuário ${collaboratorId} no ciclo ativo não encontrada`,
            );
        }

        const isCompleted =
            evaluation.autoEvaluation ||
            evaluation.evaluation360 ||
            evaluation.mentoring ||
            evaluation.reference;

        return {
            id: evaluation.evaluator.id,
            name: evaluation.evaluator.name || 'Sem nome',
            email: evaluation.evaluator.email,
            CycleConfigId: evaluation.cycleConfigId.toString(),
            status: isCompleted ? ('finalizado' as const) : ('pendente' as const),
            breakdown: {
                autoEvaluation: !!evaluation.autoEvaluation,
                evaluation360: !!evaluation.evaluation360,
                mentoring: !!evaluation.mentoring,
                references: !!evaluation.reference,
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
                select: { cycleConfigId: true },
            });
            targetCycle = latestEvaluation?.cycleConfigId?.toString() || 'N/A';
        }

        // Buscar APENAS as avaliações do ciclo atual com seus usuários e roles
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycleConfigId: parseInt(targetCycle, 10) },
            include: {
                evaluator: {
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
                reference: true,
            },
        });

        const roleStats = new Map<string, { total: number; completed: number; pending: number }>();

        evaluations.forEach((evaluation) => {
            const userRoles = evaluation.evaluator.userRoles.map((ur) => ur.role);

            if (userRoles.length === 0) return;

            const isCompleted =
                evaluation.autoEvaluation ||
                evaluation.evaluation360 ||
                evaluation.mentoring ||
                evaluation.reference;

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
            lastUpdated: new Date(getBrazilDate()).toISOString(),
        };
    }

    // retorna as estatísticas de completude por trilha (track) no ciclo ativo
    async getTrackCompletionStats(): Promise<any> {
        // Buscar ciclo ativo diretamente
        const cycleConfig = (
            await this.prisma.cycleConfig.findMany({
                select: { id: true, name: true, startDate: true, endDate: true, done: true },
            })
        ).find(
            (cycle) =>
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                new Date(getBrazilDate()) >= cycle.startDate &&
                new Date(getBrazilDate()) <= cycle.endDate,
        );
        if (!cycleConfig) {
            throw new NotFoundException('Nenhum ciclo ativo encontrado');
        }

        // Buscar avaliações do ciclo ativo com trilha do avaliado
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycleConfigId: cycleConfig.id },
            include: {
                evaluator: {
                    include: {
                        track: true,
                    },
                },
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
        });

        const trackStats = new Map<string, { total: number; completed: number; pending: number }>();

        evaluations.forEach((evaluation) => {
            const trackName = evaluation.evaluator.track?.name || 'Sem trilha';
            const isCompleted =
                evaluation.autoEvaluation ||
                evaluation.evaluation360 ||
                evaluation.mentoring ||
                evaluation.reference;

            const current = trackStats.get(trackName) || { total: 0, completed: 0, pending: 0 };
            current.total += 1;
            if (isCompleted) {
                current.completed += 1;
            } else {
                current.pending += 1;
            }
            trackStats.set(trackName, current);
        });

        // Converter para array de DTOs
        const tracks = Array.from(trackStats.entries()).map(([track, stats]) => ({
            track,
            totalUsers: stats.total,
            completedUsers: stats.completed,
            pendingUsers: stats.pending,
            completionPercentage:
                stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        }));

        return {
            tracks,
            lastUpdated: new Date(getBrazilDate()).toISOString(),
        };
    }

    async getDashboardSimpleEmployers(): Promise<{
        completionPercentage: number;
        pendingEvaluations: number;
    }> {
        // Buscar ciclo ativo
        const cycleConfig = (
            await this.prisma.cycleConfig.findMany({
                select: { id: true, name: true, startDate: true, endDate: true, done: true },
            })
        ).find(
            (cycle) =>
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                new Date(getBrazilDate()) >= cycle.startDate &&
                new Date(getBrazilDate()) <= cycle.endDate,
        );
        if (!cycleConfig) {
            return { completionPercentage: 0, pendingEvaluations: 0 };
        }

        // Buscar todos os usuários com role EMPLOYER ativa
        const allEmployers = await this.prisma.user.findMany({
            include: {
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });
        const employers = allEmployers.filter((user) =>
            user.userRoles.some((ur) => ur.role === 'EMPLOYER'),
        );
        const totalEmployers = employers.length;
        const employerIds = employers.map((e) => e.id);

        // Buscar todas as avaliações do ciclo atual para os EMPLOYERS
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: { in: employerIds },
                cycleConfigId: cycleConfig.id,
            },
            include: {
                autoEvaluation: true,
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
        });
        // Considera completa se pelo menos um dos relacionamentos existe
        const completedEvaluations = evaluations.filter((ev) => ev.autoEvaluation).length;
        const pendingEvaluations = totalEmployers - completedEvaluations;
        const completionPercentage =
            totalEmployers > 0 ? Math.round((completedEvaluations / totalEmployers) * 100) : 0;
        return {
            completionPercentage,
            pendingEvaluations,
        };
    }

    private getCycleEndDate(cycle: string): string {
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
