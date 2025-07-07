import { CollaboratorsStatusDto, CollaboratorStatusDto } from '../dto/collaborator.dashboard.dto';
import { SystemConfigService } from '../../../common/services/system-config.service';
import { RoleCompletionStatsDto } from '../dto/roles.dashboard.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';
import { EvaluationStatus } from '@prisma/client';

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
                evaluatee: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalEvaluations = evaluations.length;
        const completedEvaluations = evaluations.filter(
            (evaluation) => evaluation.status === EvaluationStatus.COMPLETED,
        ).length;

        const pendingEvaluations = totalEvaluations - completedEvaluations;
        const completionPercentage =
            totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0;

        const autoEvaluationCount = evaluations.filter(
            (evaluation) =>
                evaluation.status === EvaluationStatus.COMPLETED &&
                evaluation.evaluatorId === evaluation.evaluateeId,
        ).length;

        const evaluation360Count = evaluations.filter(
            (evaluation) =>
                evaluation.status === EvaluationStatus.COMPLETED &&
                evaluation.evaluatorId !== evaluation.evaluateeId,
        ).length;

        return {
            overall: {
                totalEvaluations,
                totalCompleted: completedEvaluations,
                totalPending: pendingEvaluations,
                completionPercentage,
            },
            cycle: {
                CycleConfigId: cycleConfig.id,
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
                cycleEndDate: this.getCycleEndDate(cycleConfig.name),
            },
            currentCycle: cycleConfig.name,
            lastUpdated: new Date().toISOString(),
        };
    }

    async getCollaboratorsStatus(): Promise<CollaboratorsStatusDto> {
        // Buscar ciclo ativo diretamente
        const cycleConfig = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
            select: { id: true, name: true },
        });
        if (!cycleConfig) {
            throw new NotFoundException('Nenhum ciclo ativo encontrado');
        }

        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycleConfigId: cycleConfig.id },
            include: { evaluatee: true },
            orderBy: { createdAt: 'desc' },
        });

        const collaboratorMap = new Map<number, any>();
        for (const ev of evaluations) {
            const isCompleted = ev.status === EvaluationStatus.COMPLETED;

            collaboratorMap.set(ev.evaluatee.id, {
                id: ev.evaluatee.id,
                name: ev.evaluatee.name || 'Sem nome',
                email: ev.evaluatee.email,
                CycleConfigId: cycleConfig.id.toString(),
                status: isCompleted ? 'finalizado' : 'pendente',
                breakdown: {
                    autoEvaluation: ev.evaluatorId === ev.evaluateeId && isCompleted,
                    evaluation360: ev.evaluatorId !== ev.evaluateeId && isCompleted,
                    mentoring: false, // Ajustar depois
                    references: false,
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
        const cycleConfig = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
            select: { id: true, name: true },
        });
        if (!cycleConfig) {
            throw new NotFoundException('Nenhum ciclo ativo encontrado');
        }

        // Buscar APENAS a avaliação do usuário no ciclo ativo
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluateeId: collaboratorId,
                cycleConfigId: cycleConfig.id,
            },
            include: {
                evaluator: true,
                evaluatee: true,
            },
        });

        if (!evaluation) {
            throw new NotFoundException(
                `Avaliação do usuário ${collaboratorId} no ciclo ativo não encontrada`,
            );
        }

        const isCompleted = evaluation.status === EvaluationStatus.COMPLETED;

        return {
            id: evaluation.evaluatee.id,
            name: evaluation.evaluatee.name || 'Sem nome',
            email: evaluation.evaluatee.email,
            CycleConfigId: evaluation.cycleConfigId.toString(),
            status: isCompleted ? ('finalizado' as const) : ('pendente' as const),
            breakdown: {
                autoEvaluation: evaluation.evaluatorId === evaluation.evaluateeId && isCompleted,
                evaluation360: evaluation.evaluatorId !== evaluation.evaluateeId && isCompleted,
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
                select: { cycleConfigId: true },
            });
            targetCycle = latestEvaluation?.cycleConfigId?.toString() || 'N/A';
        }

        // Buscar APENAS as avaliações do ciclo atual com seus usuários e roles
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycleConfigId: parseInt(targetCycle, 10) },
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

            const isCompleted = evaluation.status === EvaluationStatus.COMPLETED;

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

    // retorna as estatísticas de completude por trilha (track) no ciclo ativo
    async getTrackCompletionStats(): Promise<any> {
        // Buscar ciclo ativo diretamente
        const cycleConfig = await this.prisma.cycleConfig.findFirst({
            where: { isActive: true },
            select: { id: true, name: true },
        });
        if (!cycleConfig) {
            throw new NotFoundException('Nenhum ciclo ativo encontrado');
        }

        // Buscar avaliações do ciclo ativo com trilha do avaliado
        const evaluations = await this.prisma.evaluation.findMany({
            where: { cycleConfigId: cycleConfig.id },
            include: {
                evaluatee: {
                    include: {
                        track: true,
                    },
                },
            },
        });

        const trackStats = new Map<string, { total: number; completed: number; pending: number }>();

        evaluations.forEach((evaluation) => {
            const trackName = evaluation.evaluatee.track?.name || 'Sem trilha';
            const isCompleted =
                evaluation.type === EvaluationType.AUTOEVALUATION ||
                evaluation.type === EvaluationType.PEER_360 ||
                evaluation.type === EvaluationType.MENTOR;

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
            lastUpdated: new Date().toISOString(),
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
