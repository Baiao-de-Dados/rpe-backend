import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssignLeaderDto } from '../dto/assign-leader.dto';
import { AssignLeaderEvaluationDto } from '../dto/assign-leader-evaluation.dto';
import { ManagerEvaluationDto } from '../dto/manager-evaluation.dto';
import { getBrazilDate, isCycleActiveUtil } from 'src/cycles/utils';

@Injectable()
export class ManagerService {
    constructor(private readonly prisma: PrismaService) {}

    async assignLeaderToProject(dto: AssignLeaderDto, managerId: number) {
        const { projectId, leaderId } = dto;

        //Validar se o gestor tem permissão para gerenciar este projeto
        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                managerId: managerId,
            },
            include: { manager: true },
        });

        if (!project) {
            throw new NotFoundException(
                'Projeto não encontrado ou você não tem permissão para gerenciá-lo.',
            );
        }

        // Validar se o líder é membro do projeto
        const isProjectMember = await this.prisma.projectMember.findFirst({
            where: {
                projectId,
                userId: leaderId,
            },
        });

        if (!isProjectMember) {
            throw new BadRequestException(
                'O líder deve ser membro do projeto antes de ser designado como líder.',
            );
        }

        // Validar se o usuário tem papel de líder
        const leaderUser = await this.prisma.user.findUnique({
            where: { id: leaderId },
            include: { userRoles: true },
        });

        if (!leaderUser) {
            throw new NotFoundException('Usuário líder não encontrado.');
        }

        const isLeader = leaderUser.userRoles.some((role) => role.role === 'LEADER');
        if (!isLeader) {
            throw new BadRequestException('O usuário selecionado não possui o papel de líder.');
        }

        //Verificar se já existe assignment para este líder neste projeto
        const existingAssignment = await this.prisma.leaderAssignment.findFirst({
            where: {
                projectId,
                leaderId,
            },
        });

        if (existingAssignment) {
            throw new BadRequestException('Este líder já está designado para este projeto.');
        }

        //Criar o assignment
        return this.prisma.leaderAssignment.create({
            data: {
                projectId,
                leaderId,
            },
            include: {
                project: true,
                leader: true,
            },
        });
    }

    /**
     * Remove um líder de um projeto
     */
    async removeLeaderFromProject(projectId: number, leaderId: number, managerId: number) {
        //Validar se o gestor tem permissão para gerenciar este projeto
        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                managerId: managerId,
            },
        });

        if (!project) {
            throw new NotFoundException(
                'Projeto não encontrado ou você não tem permissão para gerenciá-lo.',
            );
        }

        // Buscar e remover o assignment
        const assignment = await this.prisma.leaderAssignment.findFirst({
            where: {
                projectId,
                leaderId,
            },
        });

        if (!assignment) {
            throw new NotFoundException('Assignment de líder não encontrado.');
        }

        await this.prisma.leaderAssignment.delete({
            where: { id: assignment.id },
        });

        return { message: 'Líder removido do projeto com sucesso.' };
    }

    /**
     * Lista todos os líderes de um projeto
     */
    async getProjectLeaders(projectId: number, managerId: number) {
        // Validar se o gestor tem permissão para gerenciar este projeto
        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                managerId: managerId,
            },
        });

        if (!project) {
            throw new NotFoundException(
                'Projeto não encontrado ou você não tem permissão para gerenciá-lo.',
            );
        }

        // Buscar todos os líderes do projeto
        return this.prisma.leaderAssignment.findMany({
            where: { projectId },
            include: {
                leader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Atribui um líder para avaliar um colaborador em um ciclo específico
     */
    async assignLeaderToEvaluateCollaborator(dto: AssignLeaderEvaluationDto, managerId: number) {
        const { collaboratorId, cycleId, leaderId } = dto;

        //Validar se o gestor tem permissão para gerenciar projetos
        const managerProjects = await this.prisma.project.findMany({
            where: {
                managerId: managerId,
            },
        });

        if (managerProjects.length === 0) {
            throw new NotFoundException('Você não tem permissão para gerenciar projetos.');
        }

        // Verificar se o colaborador é membro de algum projeto do gestor
        const collaboratorProject = await this.prisma.projectMember.findFirst({
            where: {
                userId: collaboratorId,
                project: {
                    managerId: managerId,
                },
            },
            include: {
                project: true,
            },
        });

        if (!collaboratorProject) {
            throw new NotFoundException(
                'Colaborador não encontrado em projetos que você gerencia.',
            );
        }

        // 3. Verificar se o ciclo existe
        const cycle = await this.prisma.cycleConfig.findUnique({
            where: { id: cycleId },
        });

        if (!cycle) {
            throw new NotFoundException('Ciclo não encontrado.');
        }

        //Se leaderId for fornecido, validar se é um líder válido
        if (leaderId) {
            // Verificar se o líder é membro do projeto
            const leaderProjectMember = await this.prisma.projectMember.findFirst({
                where: {
                    userId: leaderId,
                    projectId: collaboratorProject.projectId,
                },
            });

            if (!leaderProjectMember) {
                throw new BadRequestException('O líder deve ser membro do projeto.');
            }

            // Verificar se o usuário tem papel de líder
            const leaderUser = await this.prisma.user.findUnique({
                where: { id: leaderId },
                include: { userRoles: true },
            });

            if (!leaderUser) {
                throw new NotFoundException('Usuário líder não encontrado.');
            }

            const isLeader = leaderUser.userRoles.some((role) => role.role === 'LEADER');
            if (!isLeader) {
                throw new BadRequestException('O usuário selecionado não possui o papel de líder.');
            }
        }

        //Verificar se já existe uma atribuição de líder para este colaborador neste ciclo
        const existingAssignment = await this.prisma.leaderEvaluationAssignment.findFirst({
            where: {
                collaboratorId,
                cycleId,
            },
        });

        //Se leaderId for null, deslinkar (remover atribuição)
        if (!leaderId) {
            if (existingAssignment) {
                // Verificar se já existe uma avaliação de líder feita
                const existingEvaluation = await this.prisma.leaderEvaluation.findFirst({
                    where: {
                        leaderId: existingAssignment.leaderId,
                        collaboratorId,
                        cycleId,
                    },
                });

                if (existingEvaluation && existingEvaluation.score !== 0) {
                    throw new BadRequestException(
                        'Não é possível deslinkar um líder que já fez a avaliação.',
                    );
                }

                // Remover a atribuição
                await this.prisma.leaderEvaluationAssignment.delete({
                    where: { id: existingAssignment.id },
                });

                return { message: 'Líder deslinkado do colaborador com sucesso.' };
            } else {
                throw new NotFoundException(
                    'Não existe atribuição de líder para este colaborador neste ciclo.',
                );
            }
        }

        // Se leaderId for fornecido, criar ou atualizar a atribuição
        if (existingAssignment) {
            //Verificar se já existe uma avaliação de líder feita
            const existingEvaluation = await this.prisma.leaderEvaluation.findFirst({
                where: {
                    leaderId: existingAssignment.leaderId,
                    collaboratorId,
                    cycleId,
                },
            });

            if (existingEvaluation && existingEvaluation.score !== 0) {
                throw new BadRequestException(
                    'Não é possível alterar o líder de uma avaliação já realizada.',
                );
            }

            //Atualizar o líder
            await this.prisma.leaderEvaluationAssignment.update({
                where: { id: existingAssignment.id },
                data: {
                    leaderId,
                },
            });
        } else {
            //Criar nova atribuição
            await this.prisma.leaderEvaluationAssignment.create({
                data: {
                    leaderId,
                    collaboratorId,
                    cycleId,
                },
            });
        }

        return { message: 'Líder atribuído para avaliar o colaborador com sucesso.' };
    }

    /**
     * Lista todas as atribuições de líderes para avaliações
     */
    async getLeaderEvaluationAssignments(managerId: number) {
        //Buscar todos os projetos do gestor
        const managerProjects = await this.prisma.project.findMany({
            where: {
                managerId: managerId,
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (managerProjects.length === 0) {
            throw new NotFoundException('Você não tem permissão para gerenciar projetos.');
        }

        //Buscar todas as atribuições de líderes para avaliações dos colaboradores dos projetos do gestor
        const projectMemberIds = managerProjects.flatMap((project) =>
            project.members.map((member) => member.userId),
        );

        const assignments = await this.prisma.leaderEvaluationAssignment.findMany({
            where: {
                collaboratorId: {
                    in: projectMemberIds,
                },
            },
            include: {
                leader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                collaborator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                cycle: {
                    select: {
                        id: true,
                        name: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        });

        return assignments;
    }

    /**
     * Lista líderes e colaboradores do gestor com suas atribuições
     */
    async getLeadersAndCollaborators(managerId: number) {
        //Buscar todos os projetos do gestor
        const managerProjects = await this.prisma.project.findMany({
            where: {
                managerId: managerId,
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                position: true,
                                userRoles: {
                                    where: { isActive: true },
                                    select: { role: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (managerProjects.length === 0) {
            throw new NotFoundException('Você não tem permissão para gerenciar projetos.');
        }

        //Separar líderes e colaboradores
        const allMembers = managerProjects.flatMap((project) =>
            project.members.map((member) => ({
                ...member.user,
                project: {
                    projectId: project.id,
                    projectName: project.name,
                },
            })),
        );

        const leaders = allMembers.filter((member) =>
            member.userRoles.some((role) => role.role === 'LEADER'),
        );

        // Colaboradores: apenas membros com papel EMPLOYER
        const collaborators = allMembers.filter((member) =>
            member.userRoles.some((role) => role.role === 'EMPLOYER'),
        );

        // Buscar atribuições de líderes para avaliações
        const collaboratorIds = collaborators.map((c) => c.id);
        const assignments = await this.prisma.leaderEvaluationAssignment.findMany({
            where: {
                collaboratorId: {
                    in: collaboratorIds,
                },
            },
        });

        //Buscar avaliações de líderes já realizadas
        const leaderEvaluations = await this.prisma.leaderEvaluation.findMany({
            where: {
                collaboratorId: {
                    in: collaboratorIds,
                },
            },
            select: {
                collaboratorId: true,
                score: true,
            },
        });

        //Montar a resposta
        const leadersResponse = leaders.map((leader) => ({
            id: leader.id,
            name: leader.name,
            project: leader.project,
        }));

        const collaboratorsResponse = collaborators.map((collaborator) => {
            const assignment = assignments.find((a) => a.collaboratorId === collaborator.id);
            const evaluation = leaderEvaluations.find((e) => e.collaboratorId === collaborator.id);

            return {
                id: collaborator.id,
                name: collaborator.name,
                position: collaborator.position,
                project: collaborator.project,
                leaderId: assignment?.leaderId || null,
                leaderRating: evaluation?.score || null,
            };
        });

        return {
            leaders: leadersResponse,
            collaborators: collaboratorsResponse,
        };
    }

    async evaluateCollaborator(dto: ManagerEvaluationDto, managerId: number) {
        const { cycleConfigId, colaboradorId, autoavaliacao } = dto;

        //Validar se o managerId do DTO é o mesmo do usuário autenticado
        if (dto.managerId !== managerId) {
            throw new BadRequestException('Você só pode avaliar como gestor autenticado.');
        }

        //Verificar se o colaborador existe e é membro de um projeto do gestor
        const collaboratorProject = await this.prisma.projectMember.findFirst({
            where: {
                userId: colaboradorId,
                project: {
                    managerId: managerId,
                },
            },
            include: {
                project: true,
                user: {
                    select: { trackId: true },
                },
            },
        });

        if (!collaboratorProject) {
            throw new BadRequestException(
                'Colaborador não encontrado ou não pertence a um projeto sob sua gestão.',
            );
        }

        // Extrair todos os critérios dos pilares para validação
        const allCriterias = autoavaliacao.pilares.flatMap(pilar => pilar.criterios);

        // Validar se os critérios pertencem à trilha do colaborador
        const trackId = collaboratorProject.user.trackId;
        const validCriteria = await this.prisma.criterionTrackConfig.findMany({
            where: { trackId },
            select: { criterionId: true },
        });
        const validCriteriaIds = validCriteria.map((c) => c.criterionId);
        const invalidCriteria = allCriterias.filter((c) => !validCriteriaIds.includes(c.criterioId));
        if (invalidCriteria.length > 0) {
            throw new BadRequestException(
                `Os seguintes critérios não pertencem à trilha do colaborador: ${invalidCriteria
                    .map((c) => c.criterioId)
                    .join(', ')}`,
            );
        }

        //Verificar se já existe avaliação para este ciclo/colaborador/gestor
        const existingEvaluation = await this.prisma.managerEvaluation.findFirst({
            where: {
                cycleId: cycleConfigId,
                managerId,
                collaboratorId: colaboradorId,
            },
        });

        if (existingEvaluation) {
            await this.prisma.managerEvaluationCriteria.deleteMany({
                where: {
                    managerEvaluationId: existingEvaluation.id,
                },
            });

            // Criar novos critérios
            const criteriaData = allCriterias.map((criteria) => ({
                managerEvaluationId: existingEvaluation.id,
                criteriaId: criteria.criterioId,
                score: criteria.nota,
                justification: criteria.justificativa,
            }));

            await this.prisma.managerEvaluationCriteria.createMany({
                data: criteriaData,
            });

            return this.prisma.managerEvaluation.findUnique({
                where: { id: existingEvaluation.id },
                include: {
                    criterias: {
                        include: {
                            criteria: true,
                        },
                    },
                },
            });
        } else {
            return this.prisma.managerEvaluation.create({
                data: {
                    cycleId: cycleConfigId,
                    managerId,
                    collaboratorId: colaboradorId,
                    criterias: {
                        create: allCriterias.map((criteria) => ({
                            criteriaId: criteria.criterioId,
                            score: criteria.nota,
                            justification: criteria.justificativa,
                        })),
                    },
                },
                include: {
                    criterias: {
                        include: {
                            criteria: true,
                        },
                    },
                },
            });
        }
    }

    /**
     * Retorna o total de líderes gerenciados pelo manager
     */
    async getTotalLeaders(managerId: number) {
        // Buscar todos os projetos do gestor
        const projects = await this.prisma.project.findMany({
            where: { managerId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                userRoles: {
                                    where: { isActive: true },
                                    select: { role: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        const leaderIds = new Set<number>();
        projects.forEach((project) => {
            project.members.forEach((member) => {
                if (member.user.userRoles.some((role) => role.role === 'LEADER')) {
                    leaderIds.add(member.user.id);
                }
            });
        });
        return { totalLeaders: leaderIds.size };
    }

    /**
     * Retorna a porcentagem de preenchimento das avaliações padrão dos colaboradores
     */
    async getEvaluationPercentage(managerId: number) {
        // Buscar todos os projetos do gestor
        const projects = await this.prisma.project.findMany({
            where: { managerId },
            include: {
                members: true,
            },
        });
        // Todos os colaboradores dos projetos, exceto o próprio gestor
        let collaboratorIds = projects.flatMap((project) => project.members.map((m) => m.userId));
        collaboratorIds = collaboratorIds.filter((id) => id !== managerId);
        // Buscar todos os ciclos ativos
        const cycles = (await this.prisma.cycleConfig.findMany()).filter(isCycleActiveUtil);
        const cycleIds = cycles.map((c) => c.id);
        // Total esperado de avaliações: para cada colaborador em cada ciclo ativo
        const totalExpected = collaboratorIds.length * cycleIds.length;
        if (totalExpected === 0) return { percentage: 0, totalFilled: 0, totalExpected: 0 };
        // Buscar avaliações padrão já preenchidas (status COMPLETED)
        const filled = await this.prisma.evaluation.count({
            where: {
                evaluatorId: { in: collaboratorIds },
                cycleConfigId: { in: cycleIds },
            },
        });
        const percentage = Math.round((filled / totalExpected) * 100);
        return { percentage, totalFilled: filled, totalExpected };
    }

    /**
     * Retorna o total de avaliações padrão não preenchidas pelos colaboradores
     */
    async getMissingEvaluations(managerId: number) {
        // Buscar todos os projetos do gestor
        const projects = await this.prisma.project.findMany({
            where: { managerId },
            include: {
                members: true,
            },
        });
        // Todos os colaboradores dos projetos
        const collaboratorIds = projects.flatMap((project) => project.members.map((m) => m.userId));
        // Buscar todos os ciclos ativos
        const cycles = (await this.prisma.cycleConfig.findMany()).filter(isCycleActiveUtil);
        const cycleIds = cycles.map((c) => c.id);
        // Total esperado de avaliações: para cada colaborador em cada ciclo ativo
        const totalExpected = collaboratorIds.length * cycleIds.length;
        if (totalExpected === 0) return { missing: 0 };
        // Buscar avaliações padrão já preenchidas
        const filled = await this.prisma.evaluation.count({
            where: {
                evaluatorId: { in: collaboratorIds },
                cycleConfigId: { in: cycleIds },
            },
        });
        return { missing: totalExpected - filled };
    }

    /**
     * Retorna a porcentagem de preenchimento das avaliações de líder dos líderes sob gestão do manager
     * O total esperado é o número de líderes únicos sob gestão do manager
     * O total preenchido é o número de líderes que já fizeram pelo menos uma avaliação de líder em qualquer ciclo ativo
     */
    async getLeaderEvaluationPercentage(managerId: number) {
        // Buscar todos os projetos do gestor
        const projects = await this.prisma.project.findMany({
            where: { managerId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                userRoles: {
                                    where: { isActive: true },
                                    select: { role: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        // Todos os colaboradores dos projetos
        const collaboratorIds = projects.flatMap((project) => project.members.map((m) => m.userId));
        // Buscar ciclos ativos
        const cycles = (await this.prisma.cycleConfig.findMany()).filter(isCycleActiveUtil);
        const cycleIds = cycles.map((c) => c.id);
        // Buscar assignments de líder para colaborador nos ciclos ativos
        const assignments = await this.prisma.leaderEvaluationAssignment.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: { in: cycleIds },
            },
        });
        const totalExpected = assignments.length;
        if (totalExpected === 0) return { percentage: 0, totalFilled: 0, totalExpected: 0 };
        // Buscar avaliações de líder realizadas para esses assignments
        const totalFilled = await this.prisma.leaderEvaluation.count({
            where: {
                collaboratorId: { in: assignments.map((a) => a.collaboratorId) },
                leaderId: { in: assignments.map((a) => a.leaderId) },
                cycleId: { in: assignments.map((a) => a.cycleId) },
            },
        });
        const percentage = Math.round((totalFilled / totalExpected) * 100);
        return { percentage, totalFilled, totalExpected };
    }

    /**
     * Retorna o total de colaboradores sob gestão do manager que não têm um líder associado (sem LeaderEvaluationAssignment)
     */
    async getCollaboratorsWithoutLeader(managerId: number) {
        // Buscar todos os projetos do gestor
        const projects = await this.prisma.project.findMany({
            where: { managerId },
            include: {
                members: true,
            },
        });

        let collaboratorIds = projects.flatMap((project) => project.members.map((m) => m.userId));
        collaboratorIds = collaboratorIds.filter((id) => id !== managerId);
        const cycles = (await this.prisma.cycleConfig.findMany()).filter(isCycleActiveUtil);
        const cycleIds = cycles.map((c) => c.id);
        const assignments = await this.prisma.leaderEvaluationAssignment.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: { in: cycleIds },
            },
        });
        const assignedSet = new Set(assignments.map((a) => `${a.collaboratorId}-${a.cycleId}`));
        let missing = 0;
        collaboratorIds.forEach((collaboratorId) => {
            cycleIds.forEach((cycleId) => {
                if (!assignedSet.has(`${collaboratorId}-${cycleId}`)) {
                    missing++;
                }
            });
        });
        return { missing };
    }

    /**
     * Retorna a autoavaliação mais recente de um usuário sob gestão do manager
     */
    async getUserAutoEvaluation(userId: number, managerId: number) {
        const isMember = await this.prisma.projectMember.findFirst({
            where: {
                userId,
                project: { managerId },
            },
        });
        if (!isMember) {
            throw new NotFoundException('Usuário não pertence a nenhum projeto sob sua gestão.');
        }
        const activeCycles = (await this.prisma.cycleConfig.findMany()).filter(isCycleActiveUtil);
        const cycleIds = activeCycles.map((c) => c.id);
        const evaluation = await this.prisma.evaluation.findFirst({
            where: {
                evaluatorId: userId,
                cycleConfigId: { in: cycleIds },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                autoEvaluation: {
                    include: {
                        assignments: {
                            include: { criterion: true },
                        },
                    },
                },
                cycleConfig: true,
            },
        });
        if (!evaluation || !evaluation.autoEvaluation) {
            throw new NotFoundException(
                'Autoavaliação não encontrada para este usuário em ciclos ativos.',
            );
        }
        return evaluation;
    }

    async getCollaboratorsEvaluationsSummary(managerId: number) {
        // Buscar todos os projetos do gestor
        const projects = await this.prisma.project.findMany({
            where: { managerId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                position: true,
                                userRoles: {
                                    where: { isActive: true },
                                    select: { role: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (projects.length === 0) {
            throw new NotFoundException('Você não tem permissão para gerenciar projetos.');
        }
        // Todos os colaboradores dos projetos (excluindo o próprio manager)
        let collaborators = projects.flatMap((project) =>
            project.members.map((member) => ({
                ...member.user,
                project: {
                    projectId: project.id,
                    projectName: project.name,
                },
            })),
        );
        collaborators = collaborators.filter((c) => c.id !== managerId);
        const collaboratorIds = collaborators.map((c) => c.id);
        // Buscar ciclos ativos
        const cycles = (await this.prisma.cycleConfig.findMany()).filter(isCycleActiveUtil);
        if (cycles.length === 0) {
            return [];
        }
        const cycleIds = cycles.map((c) => c.id);
        // Buscar avaliações em lote
        const autoEvaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: { in: collaboratorIds },
                cycleConfigId: { in: cycleIds },
            },
            include: {
                autoEvaluation: {
                    include: { assignments: true },
                },
            },
        });
        // Mapear autoavaliações por colaborador e ciclo
        const autoEvalMap = new Map();
        for (const ev of autoEvaluations) {
            if (ev.autoEvaluation) {
                // Só pega a mais recente por ciclo
                const key = `${ev.evaluatorId}-${ev.cycleConfigId}`;
                if (!autoEvalMap.has(key) || autoEvalMap.get(key).createdAt < ev.createdAt) {
                    autoEvalMap.set(key, ev);
                }
            }
        }
        // Buscar avaliações de líder
        const leaderEvaluations = await this.prisma.leaderEvaluation.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: { in: cycleIds },
            },
        });
        const leaderEvalMap = new Map();
        for (const le of leaderEvaluations) {
            const key = `${le.collaboratorId}-${le.cycleId}`;
            if (!leaderEvalMap.has(key) || leaderEvalMap.get(key).createdAt < le.createdAt) {
                leaderEvalMap.set(key, le);
            }
        }
        // Buscar avaliações do manager
        const managerEvaluations = await this.prisma.managerEvaluation.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                managerId,
                cycleId: { in: cycleIds },
            },
            include: {
                criterias: true,
            },
        });
        const managerEvalMap = new Map();
        for (const me of managerEvaluations) {
            const key = `${me.collaboratorId}-${me.cycleId}`;
            if (!managerEvalMap.has(key) || managerEvalMap.get(key).createdAt < me.createdAt) {
                managerEvalMap.set(key, me);
            }
        }
        // Montar resposta
        const result: any[] = [];
        for (const collaborator of collaborators) {
            // Para cada ciclo ativo
            for (const cycle of cycles) {
                const autoEval = autoEvalMap.get(`${collaborator.id}-${cycle.id}`);
                let autoEvalScore: number | null = null;
                if (
                    autoEval &&
                    autoEval.autoEvaluation &&
                    autoEval.autoEvaluation.assignments.length > 0
                ) {
                    const sum = autoEval.autoEvaluation.assignments.reduce(
                        (acc, a) => acc + a.score,
                        0,
                    );
                    autoEvalScore = sum / autoEval.autoEvaluation.assignments.length;
                }
                // Substituir leaderEvaluationScore por equalizationScore
                let equalizationScore: number | null = null;
                const equalization = await this.prisma.equalization.findFirst({
                    where: {
                        collaboratorId: collaborator.id,
                        cycleId: cycle.id,
                    },
                });
                if (equalization) {
                    equalizationScore = equalization.score;
                }
                const leaderEval = leaderEvalMap.get(`${collaborator.id}-${cycle.id}`);
                const leaderEvalScore: number | null = leaderEval ? leaderEval.score : null;
                const managerEval = managerEvalMap.get(`${collaborator.id}-${cycle.id}`);
                let managerEvalScore: number | null = null;
                if (managerEval && managerEval.criterias.length > 0) {
                    const sum = managerEval.criterias.reduce((acc, c) => acc + c.score, 0);
                    managerEvalScore = sum / managerEval.criterias.length;
                }
                const status = managerEvalScore === null ? 'pendente' : 'finalizado';
                result.push({
                    collaborator: {
                        id: collaborator.id,
                        name: collaborator.name,
                        email: collaborator.email,
                        position: collaborator.position,
                        project: collaborator.project,
                    },
                    cycle: {
                        id: cycle.id,
                        name: cycle.name,
                    },
                    autoEvaluationScore: autoEvalScore,
                    equalizationScore: equalizationScore, // Alterado aqui
                    managerEvaluationScore: managerEvalScore,
                    status,
                });
            }
        }
        return result;
    }

    /**
     * Retorna os detalhes completos das avaliações dos colaboradores sob gestão do manager
     */
    async getCollaboratorsEvaluationsDetails(managerId: number) {
        // Buscar todos os projetos do gestor
        const projects = await this.prisma.project.findMany({
            where: { managerId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                position: true,
                                userRoles: {
                                    where: { isActive: true },
                                    select: { role: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (projects.length === 0) {
            throw new NotFoundException('Você não tem permissão para gerenciar projetos.');
        }
        // Todos os colaboradores dos projetos (excluindo o próprio manager)
        let collaborators = projects.flatMap((project) =>
            project.members.map((member) => ({
                ...member.user,
                project: {
                    projectId: project.id,
                    projectName: project.name,
                },
            })),
        );
        collaborators = collaborators.filter((c) => c.id !== managerId);
        const collaboratorIds = collaborators.map((c) => c.id);
        // Buscar ciclos ativos
        const cycles = (await this.prisma.cycleConfig.findMany()).filter(
            (cycle) =>
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                new Date(getBrazilDate()) >= cycle.startDate &&
                new Date(getBrazilDate()) <= cycle.endDate,
        );
        if (cycles.length === 0) {
            return [];
        }
        // Buscar avaliações em lote
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: { in: collaboratorIds },
                cycleConfigId: { in: cycles.map((c) => c.id) },
            },
            include: {
                autoEvaluation: {
                    include: { assignments: true },
                },
                evaluation360: true,
                mentoring: true,
                reference: true,
                evaluator: true,
                cycleConfig: true,
            },
        });
        // Buscar avaliações de líder
        const leaderEvaluations = await this.prisma.leaderEvaluation.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: { in: cycles.map((c) => c.id) },
            },
        });
        // Montar resposta detalhada
        const result: any[] = [];
        for (const collaborator of collaborators) {
            for (const cycle of cycles) {
                const evaluation = evaluations.find(
                    (ev) => ev.evaluatorId === collaborator.id && ev.cycleConfigId === cycle.id,
                );
                const leaderEval = leaderEvaluations.find(
                    (le) => le.collaboratorId === collaborator.id && le.cycleId === cycle.id,
                );
                result.push({
                    collaborator: {
                        id: collaborator.id,
                        name: collaborator.name,
                        email: collaborator.email,
                        position: collaborator.position,
                        project: collaborator.project,
                    },
                    cycle: {
                        id: cycle.id,
                        name: cycle.name,
                    },
                    autoEvaluation: evaluation?.autoEvaluation || null,
                    evaluation360: evaluation?.evaluation360 || null,
                    reference: evaluation?.reference || null,
                    mentoring: evaluation?.mentoring || null,
                    leaderEvaluation: leaderEval || null,
                });
            }
        }
        return result;
    }

    /**
     * Retorna todos os colaboradores sob gestão do manager com notas do ciclo ativo
     */
    async getAllCollaboratorsEvaluations(managerId: number) {
        // Buscar todos os projetos do gestor
        const projects = await this.prisma.project.findMany({
            where: { managerId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                position: true,
                            },
                        },
                    },
                },
            },
        });
        // Todos os colaboradores dos projetos (excluindo o próprio manager)
        let collaborators = projects.flatMap((project) =>
            project.members.map((member) => member.user),
        );
        collaborators = collaborators.filter((c) => c.id !== managerId);
        const collaboratorIds = collaborators.map((c) => c.id);
        // Buscar ciclo ativo
        const activeCycle = (await this.prisma.cycleConfig.findMany()).find(
            (cycle) =>
                !cycle.done &&
                cycle.startDate !== null &&
                cycle.endDate !== null &&
                new Date() >= cycle.startDate &&
                new Date() <= cycle.endDate,
        );
        if (!activeCycle) {
            // Retorna todos os colaboradores com notas/ciclo null
            return collaborators.map((c) => ({
                cycle: null,
                collaborator: {
                    id: c.id,
                    name: c.name,
                    position: c.position,
                },
                autoEvaluation: null,
                evaluation360: null,
                managerEvaluation: null,
                equalization: null,
            }));
        }
        // Buscar avaliações em lote
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                evaluatorId: { in: collaboratorIds },
                cycleConfigId: activeCycle.id,
            },
            include: {
                autoEvaluation: { include: { assignments: true } },
                evaluation360: true,
            },
        });

        // Buscar equalizações separadamente
        const equalizations = await this.prisma.equalization.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                cycleId: activeCycle.id,
            },
        });

        // Buscar nota da autoavaliação usando o mesmo método de getUserAutoEvaluation
        const autoEvaluationScores: Record<number, number | null> = {};
        for (const c of collaborators) {
            try {
                const autoEval = await this.getUserAutoEvaluation(c.id, managerId);
                // Se houver autoEvaluation, calcula a média das notas dos assignments
                if (autoEval && autoEval.autoEvaluation && autoEval.autoEvaluation.assignments.length > 0) {
                    const sum = autoEval.autoEvaluation.assignments.reduce((acc, a) => acc + a.score, 0);
                    autoEvaluationScores[c.id] = Math.round((sum / autoEval.autoEvaluation.assignments.length) * 10) / 10;
                } else {
                    autoEvaluationScores[c.id] = null;
                }
            } catch {
                autoEvaluationScores[c.id] = null;
            }
        }

        // Buscar avaliações de gestor
        const managerEvaluations = await this.prisma.managerEvaluation.findMany({
            where: {
                collaboratorId: { in: collaboratorIds },
                managerId,
                cycleId: activeCycle.id,
            },
            include: { criterias: true },
        });
        // Indexa avaliações de gestor por colaborador
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
        // Monta resposta
        return collaborators.map((c) => {
            const evaluation = evaluations.find((ev) => ev.evaluatorId === c.id);
            // Autoavaliação: usar nota calculada pelo método getUserAutoEvaluation
            const autoEvaluationGrade: number | null = autoEvaluationScores[c.id] ?? null;
            // Avaliação 360
            let evaluation360Grade: number | null = null;
            if (evaluation?.evaluation360?.length) {
                const scores = evaluation.evaluation360.map((e) => e.score);
                evaluation360Grade =
                    Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
            }
            // Equalização
            let equalizationGrade: number | null = null;
            const equalization = equalizations.find((eq) => eq.collaboratorId === c.id);
            if (equalization?.score !== undefined && equalization?.score !== null) {
                equalizationGrade = Math.round(equalization.score * 10) / 10;
            }
            // Gestor
            const managerGrade = managerByCollaborator.get(c.id) ?? null;
            return {
                cycle: {
                    id: activeCycle.id,
                    name: activeCycle.name,
                    startDate: activeCycle.startDate,
                    endDate: activeCycle.endDate,
                },
                collaborator: {
                    id: c.id,
                    name: c.name,
                    position: c.position,
                },
                autoEvaluation: autoEvaluationGrade,
                evaluation360: evaluation360Grade,
                managerEvaluation: managerGrade,
                equalization: equalizationGrade,
            };
        });
    }

    /**
     * Retorna o conteúdo completo da avaliação de um colaborador em um ciclo específico
     */
    async getCollaboratorEvaluationResult(managerId: number, collaboratorId: number, cycleConfigId: number) {
        // Verifica se o colaborador está sob gestão do manager
        const isMember = await this.prisma.projectMember.findFirst({
            where: {
                userId: collaboratorId,
                project: { managerId },
            },
        });
        if (!isMember) {
            throw new NotFoundException('Colaborador não pertence a nenhum projeto sob sua gestão.');
        }
        // Busca a evaluation do colaborador naquele ciclo
        const evaluation = await this.prisma.evaluation.findFirst({
            where: { evaluatorId: collaboratorId, cycleConfigId },
            include: {
                evaluator: { select: { id: true, name: true, track: { select: { name: true } } } },
                autoEvaluation: { include: { assignments: { include: { criterion: true } } } },
                evaluation360: true,
                mentoring: true,
                reference: true,
            },
        });
        if (!evaluation) {
            throw new NotFoundException('Nenhuma avaliação encontrada para este ciclo.');
        }

        // Buscar equalização separadamente
        const equalization = await this.prisma.equalization.findFirst({
            where: {
                collaboratorId,
                cycleId: cycleConfigId,
            },
        });

        // Busca a avaliação do gestor
        const managerEvaluation = await this.prisma.managerEvaluation.findFirst({
            where: { collaboratorId, cycleId: cycleConfigId, managerId },
            include: { criterias: { include: { criteria: true } } },
        });
        let managerBlock: any = null;
        let average: number | null = null;
        if (managerEvaluation) {
            if (managerEvaluation.criterias?.length) {
                const scores = managerEvaluation.criterias.map((c) => c.score);
                average = Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
            }
            managerBlock = {
                criterias: managerEvaluation.criterias.map((c) => ({
                    criteriaId: c.criteriaId,
                    score: c.score,
                    justification: c.justification,
                    criteriaName: c.criteria.name,
                })),
                average,
            };
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
            managerEvaluation: managerBlock,
            equalization: equalization
                ? {
                      score: equalization.score,
                  }
                : null,
        };
    }

    /**
     * Retorna a avaliação do manager para um colaborador específico em um ciclo
     */
    async getManagerEvaluation(managerId: number, collaboratorId: number, cycleConfigId: number) {
        // Verifica se o colaborador está sob gestão do manager
        const isMember = await this.prisma.projectMember.findFirst({
            where: {
                userId: collaboratorId,
                project: { managerId },
            },
        });
        if (!isMember) {
            throw new NotFoundException('Colaborador não pertence a nenhum projeto sob sua gestão.');
        }

        // Busca a avaliação do manager
        const managerEvaluation = await this.prisma.managerEvaluation.findFirst({
            where: { 
                collaboratorId, 
                cycleId: cycleConfigId, 
                managerId 
            },
            include: { 
                criterias: { 
                    include: { 
                        criteria: {
                            include: {
                                pillar: true
                            }
                        } 
                    } 
                } 
            },
        });

        if (!managerEvaluation) {
            return {
                id: null,
                cycleConfigId,
                managerId,
                collaboratorId,
                autoavaliacao: {
                    pilares: []
                },
                createdAt: null,
                updatedAt: null
            };
        }

        // Agrupar critérios por pilar
        const pilaresMap = new Map();
        for (const criteria of managerEvaluation.criterias) {
            const pilarId = criteria.criteria.pillarId;
            if (!pilaresMap.has(pilarId)) {
                pilaresMap.set(pilarId, {
                    pilarId: pilarId,
                    criterios: [],
                });
            }
            pilaresMap.get(pilarId).criterios.push({
                criterioId: criteria.criteriaId,
                nota: criteria.score,
                justificativa: criteria.justification,
            });
        }

        return {
            id: managerEvaluation.id,
            cycleConfigId: managerEvaluation.cycleId,
            managerId: managerEvaluation.managerId,
            collaboratorId: managerEvaluation.collaboratorId,
            autoavaliacao: {
                pilares: Array.from(pilaresMap.values())
            },
            createdAt: managerEvaluation.createdAt,
            updatedAt: managerEvaluation.updatedAt
        };
    }

    // Utilitário para formatar pilares igual ao EmployerService
    private formatAutoEvaluationPilares(assignments: any[]) {
        const pilaresMap = new Map<number, any>();
        for (const a of assignments) {
            const pilarId = a.criterion.pillarId;
            if (!pilaresMap.has(pilarId)) {
                pilaresMap.set(pilarId, { pilarId, criterios: [] });
            }
            pilaresMap.get(pilarId).criterios.push({
                criterioId: a.criterionId,
                nota: a.score,
                justificativa: a.justification,
            });
        }
        return Array.from(pilaresMap.values());
    }
}
