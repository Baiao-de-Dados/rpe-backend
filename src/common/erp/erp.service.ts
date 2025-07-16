import { EncryptionService } from '../../cryptography/encryption.service';
import { ErpProjectMemberDto } from './dto/erp-project-member.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus, UserRole } from '@prisma/client';
import { AuthService } from '../../auth/auth.service';
import { ErpProjectDto } from './dto/erp-project.dto';
import { getBrazilDate } from '../../cycles/utils';
import { ErpSyncDto } from './dto/erp-sync.dto';
import dbData from '../../db.json';

@Injectable()
export class ErpService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly encryptionService: EncryptionService,
    ) {}

    async buildErpJson(): Promise<{ projects: ErpProjectDto[]; lastSyncDate: string }> {
        let lastSyncDate = '';

        const lastDate = await this.prisma.dateModel.findFirst({
            orderBy: { date: 'desc' },
        });
        lastSyncDate = lastDate?.date.toISOString() ?? '';

        const projects = await this.prisma.project.findMany({
            include: {
                manager: { include: { track: true } },
                leaderAssignments: { include: { leader: { include: { track: true } } } },
                members: { include: { user: { include: { track: true } } } },
            },
        });

        const erpProjects: ErpProjectDto[] = projects.map((p) => {
            const projectMembers: ErpProjectMemberDto[] = [];

            if (p.manager) {
                projectMembers.push({
                    email: this.encryptionService.safeDecrypt(p.manager.email),
                    name: p.manager.name,
                    track: p.manager.track?.name ?? null,
                    position: p.manager.position,
                    role: 'MANAGER',
                    startDate: new Date().toISOString(),
                    endDate: null,
                });
            }

            for (const la of p.leaderAssignments) {
                projectMembers.push({
                    email: this.encryptionService.safeDecrypt(la.leader.email),
                    name: la.leader.name,
                    track: la.leader.track?.name ?? null,
                    position: la.leader.position,
                    role: 'LEADER',
                    startDate: new Date().toISOString(),
                    endDate: null,
                });
            }

            for (const pm of p.members) {
                projectMembers.push({
                    email: this.encryptionService.safeDecrypt(pm.user.email),
                    name: pm.user.name,
                    track: pm.user.track?.name ?? null,
                    position: pm.user.position,
                    role: 'EMPLOYER',
                    startDate: pm.startDate.toISOString(),
                    endDate: pm.endDate?.toISOString() ?? null,
                });
            }
            return {
                name: p.name,
                status: p.status,
                projectMembers,
            };
        });
        return { projects: erpProjects, lastSyncDate };
    }

    async syncWithErp(dto: ErpSyncDto): Promise<void> {
        const allUsers = await this.prisma.user.findMany({
            select: { id: true, email: true },
        });
        const emailToId = new Map<string, number>();
        for (const u of allUsers) {
            try {
                const plain = this.encryptionService.decrypt(u.email);
                emailToId.set(plain, u.id);
            } catch {
                // Ignora valores que não conseguirem decifrar
            }
        }

        const trackNames = Array.from(new Set(dto.users.map((u) => u.track)));
        for (const name of trackNames) {
            await this.prisma.track.upsert({
                where: { name },
                update: {},
                create: { name },
            });
        }
        const tracks = await this.prisma.track.findMany();
        const trackMap = new Map(tracks.map((t) => [t.name, t]));

        const userMap = new Map<string, number>();
        for (const u of dto.users) {
            const existingId = emailToId.get(u.email);
            const track = trackMap.get(u.track);
            if (!track) throw new Error(`Track not found: ${u.track}`);

            if (existingId) {
                await this.prisma.user.update({
                    where: { id: existingId },
                    data: {
                        name: u.name,
                        position: u.position,
                        trackId: track.id,
                    },
                });
                const roles = await this.prisma.userRoleLink
                    .findMany({
                        where: { userId: existingId },
                        select: { role: true },
                    })
                    .then((rs) => rs.map((r) => r.role));
                if (!roles.includes(u.primaryRole as UserRole)) {
                    await this.prisma.userRoleLink.create({
                        data: { userId: existingId, role: u.primaryRole as UserRole },
                    });
                }
                userMap.set(u.email, existingId);
            } else {
                const created = await this.authService.createUserWithRoles(
                    u.email,
                    'senha123',
                    u.name,
                    u.position,
                    [u.primaryRole as UserRole],
                    undefined,
                );

                await this.prisma.user.update({
                    where: { id: created.id },
                    data: { trackId: track.id },
                });
                userMap.set(u.email, created.id);
            }
        }

        for (const u of dto.users) {
            if (!u.mentorEmail) continue;
            const menteeId = userMap.get(u.email)!;
            const mentorId = userMap.get(u.mentorEmail);
            if (mentorId) {
                await this.prisma.user.update({
                    where: { id: menteeId },
                    data: { mentorId },
                });
            }
        }

        const projectMap = new Map<string, number>();
        for (const p of dto.projects) {
            const managerMember = p.projectMembers.find((m) => m.role === 'MANAGER');
            const managerUid = managerMember ? userMap.get(managerMember.email) : null;

            const existing = await this.prisma.project.findFirst({ where: { name: p.name } });
            if (existing) {
                await this.prisma.project.update({
                    where: { id: existing.id },
                    data: {
                        status: p.status as ProjectStatus,
                        ...(managerUid && { manager: { connect: { id: managerUid } } }),
                    },
                });
                projectMap.set(p.name, existing.id);
            } else {
                const created = await this.prisma.project.create({
                    data: {
                        name: p.name,
                        status: p.status as ProjectStatus,
                        manager: { connect: { id: managerUid! } },
                    },
                });
                projectMap.set(p.name, created.id);
            }
        }

        for (const p of dto.projects) {
            const projId = projectMap.get(p.name)!;

            await this.prisma.leaderAssignment.deleteMany({ where: { projectId: projId } });
            await this.prisma.projectMember.deleteMany({ where: { projectId: projId } });

            for (const member of p.projectMembers) {
                const uid = userMap.get(member.email);
                if (!uid) continue;

                if (member.role === 'LEADER') {
                    await this.prisma.leaderAssignment.create({
                        data: {
                            projectId: projId,
                            leaderId: uid,
                        },
                    });
                } else if (member.role === 'EMPLOYER') {
                    await this.prisma.projectMember.create({
                        data: {
                            projectId: projId,
                            userId: uid,
                            startDate: new Date(member.startDate),
                            endDate: member.endDate ? new Date(member.endDate) : null,
                        },
                    });
                }
            }
        }
    }

    async syncWithDbJson(): Promise<void> {
        await this.syncWithErp(dbData as ErpSyncDto);
        await this.prisma.dateModel.create({
            data: { date: getBrazilDate() },
        });
    }
}
