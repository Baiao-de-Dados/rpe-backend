import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErpSyncDto } from './dto/erp-sync.dto';
import { ErpUserDto } from './dto/erp-user.dto';
import { ErpProjectDto } from './dto/erp-project.dto';
import { ProjectStatus, UserRole } from '@prisma/client';
import { ErpProjectMemberDto } from './dto/erp-project-member.dto';

@Injectable()
export class ErpService {
    constructor(private readonly prisma: PrismaService) {}

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
            },
        });

        const toMemberDto = (p: (typeof projects)[0], role: UserRole): ErpProjectMemberDto[] =>
            p.members
                .filter((m) => m.role === role)
                .map((m) => ({
                    email: m.user.email,
                    startDate: m.startDate.toISOString(),
                    endDate: m.endDate ? m.endDate.toISOString() : null,
                }));

        const erpProjects: ErpProjectDto[] = projects.map((p) => ({
            name: p.name,
            status: p.status,
            manager: toMemberDto(p, UserRole.MANAGER)[0],
            leaders: toMemberDto(p, UserRole.LEADER),
            collaborators: toMemberDto(p, UserRole.EMPLOYER),
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

        // Usuários (upsert + remoção)
        const incomingEmails = dto.users.map((u) => u.email);
        for (const u of dto.users) {
            await this.prisma.user.upsert({
                where: { email: u.email },
                update: {
                    name: u.name,
                    track: { connect: { name: u.track } },
                    position: u.position,
                },
                create: {
                    email: u.email,
                    password: 'change_me',
                    name: u.name,
                    position: u.position,
                    track: { connect: { name: u.track } },
                },
            });
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
            const existingProject = await this.prisma.project.findFirst({
                where: { name: p.name },
            });

            let proj;
            if (existingProject) {
                proj = await this.prisma.project.update({
                    where: { id: existingProject.id },
                    data: { status: p.status as ProjectStatus },
                });
            } else {
                proj = await this.prisma.project.create({
                    data: { name: p.name, status: p.status as ProjectStatus },
                });
            }

            // limpa membros existentes
            await this.prisma.projectMember.deleteMany({
                where: { projectId: proj.id },
            });

            // recria manager, líderes e colaboradores com datas
            await this.createMember(proj.id, p.manager, UserRole.MANAGER);

            for (const m of p.leaders) {
                await this.createMember(proj.id, m, UserRole.LEADER);
            }

            for (const m of p.collaborators) {
                await this.createMember(proj.id, m, UserRole.EMPLOYER);
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

    private async createMember(projectId: number, member: ErpProjectMemberDto, role: string) {
        return this.prisma.projectMember.create({
            data: {
                project: { connect: { id: projectId } },
                user: { connect: { email: member.email } },
                role: role as UserRole,
                startDate: new Date(member.startDate),
                endDate: member.endDate ? new Date(member.endDate) : undefined,
            },
        });
    }
}
