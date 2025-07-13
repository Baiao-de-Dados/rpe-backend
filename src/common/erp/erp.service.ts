import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErpSyncDto } from './dto/erp-sync.dto';
import { ErpUserDto } from './dto/erp-user.dto';
import { ErpProjectDto } from './dto/erp-project.dto';
import { ProjectStatus, UserRole } from '@prisma/client';
import { ErpProjectMemberDto } from './dto/erp-project-member.dto';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class ErpService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
    ) {}

    async buildErpJson(): Promise<ErpSyncDto> {
        const users = await this.prisma.user.findMany({
            include: {
                track: true,
                mentor: true,
                userRoles: { where: { isActive: true } },
            },
        });

        const erpUsers: ErpUserDto[] = users.map((u) => ({
            email: u.email,
            name: u.name,
            track: u.track!.name,
            primaryRole: this.pickPrimaryRole(u.userRoles.map((r) => r.role)),
            position: u.position,
            mentorEmail: u.mentor!.email,
        }));

        // Projetos e membros com datas
        const projects = await this.prisma.project.findMany({
            include: {
                members: { include: { user: true } },
                manager: true,
                leaderAssignments: { include: { leader: true } },
            },
        });

        const erpProjects: ErpProjectDto[] = projects.map((p) => ({
            name: p.name,
            status: p.status,
            manager: {
                email: p.manager.email,
                startDate: new Date().toISOString(),
                endDate: null,
            },
            leaders: p.leaderAssignments.map((la) => ({
                email: la.leader.email,
                startDate: new Date().toISOString(),
                endDate: null,
            })),
            collaborators: p.members.map((m) => ({
                email: m.user.email,
                startDate: m.startDate.toISOString(),
                endDate: m.endDate ? m.endDate.toISOString() : null,
            })),
        }));

        return { users: erpUsers, projects: erpProjects };
    }

    async syncWithErp(dto: ErpSyncDto) {
        const trackNames = Array.from(new Set(dto.users.map((u) => u.track)));
        for (const name of trackNames) {
            await this.prisma.track.upsert({
                where: { name },
                update: {},
                create: { name },
            });
        }

        // Usuários (criação via AuthService para garantir autenticação)
        const incomingEmails = dto.users.map((u) => u.email);
        for (const u of dto.users) {
            const role = (u.primaryRole as UserRole) || UserRole.EMPLOYER;
            let mentorId: number | undefined = undefined;
            if (u.mentorEmail) {
                const mentor = await this.prisma.user.findUnique({
                    where: { email: u.mentorEmail },
                });
                mentorId = mentor?.id;
            }
            try {
                await this.authService.createUserWithRoles(
                    u.email,
                    'change_me',
                    u.name,
                    u.position,
                    [role],
                    mentorId,
                );
            } catch (e) {
                if (e instanceof ConflictException) {
                    // Usuário já existe, pode atualizar dados básicos se quiser
                    await this.prisma.user.update({
                        where: { email: u.email },
                        data: {
                            name: u.name,
                            position: u.position,
                            track: { connect: { name: u.track } },
                        },
                    });
                } else {
                    throw e;
                }
            }
        }
        await this.prisma.user.deleteMany({
            where: { email: { notIn: incomingEmails } },
        });

        // Mentores
        for (const u of dto.users) {
            await this.prisma.user.update({
                where: { email: u.email },
                data: { mentor: { connect: { email: u.mentorEmail } } },
            });
        }

        // Projetos + membros
        const incomingProjects = dto.projects.map((p) => p.name);
        for (const p of dto.projects) {
            const managerUser = await this.prisma.user.findUnique({
                where: { email: p.manager.email },
            });
            if (!managerUser) {
                throw new Error(`Manager user not found for email: ${p.manager.email}`);
            }

            const existingProject = await this.prisma.project.findFirst({
                where: { name: p.name },
            });

            let proj;
            if (existingProject) {
                proj = await this.prisma.project.update({
                    where: { id: existingProject.id },
                    data: {
                        status: p.status as ProjectStatus,
                        managerId: managerUser.id,
                    },
                });
            } else {
                proj = await this.prisma.project.create({
                    data: {
                        name: p.name,
                        status: p.status as ProjectStatus,
                        managerId: managerUser.id,
                    },
                });
            }

            // limpa membros existentes e leader assignments
            await this.prisma.projectMember.deleteMany({
                where: { projectId: proj.id },
            });

            await this.prisma.leaderAssignment.deleteMany({
                where: { projectId: proj.id },
            });

            // recria colaboradores com datas
            for (const m of p.collaborators) {
                await this.createMember(proj.id, m);
            }

            // recria leader assignments
            for (const leader of p.leaders) {
                const leaderUser = await this.prisma.user.findUnique({
                    where: { email: leader.email },
                });
                if (leaderUser) {
                    await this.prisma.leaderAssignment.create({
                        data: {
                            projectId: proj.id,
                            leaderId: leaderUser.id,
                        },
                    });
                }
            }
        }

        // remove projetos ausentes
        await this.prisma.project.deleteMany({
            where: { name: { notIn: incomingProjects } },
        });
    }

    private pickPrimaryRole(roles: string[]): string {
        if (roles.includes('MENTOR')) return 'MENTOR';
        if (roles.includes('MANAGER')) return 'MANAGER';
        if (roles.includes('LEADER')) return 'LEADER';
        if (roles.includes('ADMIN')) return 'ADMIN';
        if (roles.includes('RH')) return 'RH';
        if (roles.includes('COMMITTEE')) return 'COMMITTEE';
        return 'EMPLOYER';
    }

    private async createMember(projectId: number, member: ErpProjectMemberDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: member.email },
        });
        if (!user) {
            throw new Error(`User not found for email: ${member.email}`);
        }
        return this.prisma.projectMember.create({
            data: {
                projectId: projectId,
                userId: user.id,
                startDate: new Date(member.startDate),
                endDate: member.endDate ? new Date(member.endDate) : null,
            },
        });
    }
}
