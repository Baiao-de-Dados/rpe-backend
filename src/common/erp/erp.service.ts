import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErpSyncDto } from './dto/erp-sync.dto';
import { ErpProjectDto } from './dto/erp-project.dto';
import { ProjectStatus, UserRole } from '@prisma/client';
import { AuthService } from '../../auth/auth.service';
import { EncryptionService } from '../../cryptography/encryption.service';
import { ErpProjectMemberDto } from './dto/erp-project-member.dto';
import dbData from '../../db.json';
import { ErpUserDto } from './dto/erp-user.dto';

@Injectable()
export class ErpService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly encryptionService: EncryptionService,
    ) {}

    private async updateUsers(dtoUsers: ErpUserDto[]): Promise<void> {
        for (const u of dtoUsers) {
            const encryptedEmail = this.encryptionService.encrypt(u.email);
            const user = await this.prisma.user.findUnique({
                where: { email: encryptedEmail },
            });
            if (!user) continue;

            const data: {
                name?: string;
                position?: string;
                trackId?: number;
                mentorId?: number;
            } = { name: u.name, position: u.position };

            const track = await this.prisma.track.findUnique({
                where: { name: u.track },
            });
            if (track) data.trackId = track.id;

            if (u.mentorEmail) {
                const mentorEncrypted = this.encryptionService.encrypt(u.mentorEmail);
                const mentor = await this.prisma.user.findUnique({
                    where: { email: mentorEncrypted },
                });
                if (mentor) data.mentorId = mentor.id;
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data,
            });
        }
    }

    private async updateProjects(dtoProjects: ErpProjectDto[]): Promise<void> {
        for (const p of dtoProjects) {
            const project = await this.prisma.project.findFirst({
                where: { name: p.name },
            });
            if (!project) continue;

            const managerMember = p.projectMembers.find((m) => m.role === 'MANAGER');
            let managerConnect: { connect: { id: number } } | undefined;

            if (managerMember) {
                const mgrEncrypted = this.encryptionService.encrypt(managerMember.email);
                const mgr = await this.prisma.user.findUnique({
                    where: { email: mgrEncrypted },
                });
                if (mgr) managerConnect = { connect: { id: mgr.id } };
            }

            await this.prisma.project.update({
                where: { id: project.id },
                data: {
                    status: p.status as ProjectStatus,
                    ...(managerConnect && { manager: managerConnect }),
                },
            });
        }
    }

    async buildErpJson(): Promise<{ projects: ErpProjectDto[] }> {
        const projects = await this.prisma.project.findMany({
            include: {
                manager: true,
                leaderAssignments: { include: { leader: true } },
                members: { include: { user: true } },
            },
        });

        const erpProjects: ErpProjectDto[] = projects.map((p) => {
            const projectMembers: ErpProjectMemberDto[] = [];

            if (p.manager) {
                projectMembers.push({
                    email: this.encryptionService.safeDecrypt(p.manager.email),
                    position: p.manager.position,
                    role: 'MANAGER',
                    startDate: new Date().toISOString(),
                    endDate: null,
                });
            }

            for (const la of p.leaderAssignments) {
                projectMembers.push({
                    email: this.encryptionService.safeDecrypt(la.leader.email),
                    position: la.leader.position,
                    role: 'LEADER',
                    startDate: new Date().toISOString(),
                    endDate: null,
                });
            }

            for (const pm of p.members) {
                projectMembers.push({
                    email: this.encryptionService.safeDecrypt(pm.user.email),
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
        return { projects: erpProjects };
    }

    async syncWithErp(dto: ErpSyncDto): Promise<void> {
        await this.updateUsers(dto.users);
        await this.updateProjects(dto.projects);

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
            const track = trackMap.get(u.track);
            if (!track) throw new Error(`Track not found: ${u.track}`);

            try {
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
            } catch (e) {
                if (e instanceof ConflictException) {
                    const encryptedEmail = this.encryptionService.encrypt(u.email);
                    const existingUser = await this.prisma.user.findUnique({
                        where: { email: encryptedEmail },
                        include: { userRoles: true },
                    });

                    if (!existingUser) throw e;
                    await this.prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            name: u.name,
                            position: u.position,
                            trackId: track.id,
                        },
                    });

                    const currentRoles = existingUser.userRoles.map((r) => r.role);
                    if (!currentRoles.includes(u.primaryRole as UserRole)) {
                        await this.prisma.userRoleLink.create({
                            data: {
                                userId: existingUser.id,
                                role: u.primaryRole as UserRole,
                            },
                        });
                    }
                    userMap.set(u.email, existingUser.id);
                } else {
                    throw e;
                }
            }
        }

        for (const u of dto.users) {
            if (!u.mentorEmail) continue;
            await this.prisma.user.update({
                where: { id: userMap.get(u.email)! },
                data: { mentorId: userMap.get(u.mentorEmail)! },
            });
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
                        manager: managerUid ? { connect: { id: managerUid } } : undefined,
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
    }
}
