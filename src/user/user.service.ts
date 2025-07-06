import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from 'src/cryptography/encryption.service';
import { User, UserRole } from '@prisma/client';
import { CreateUserDTO } from './dto/create-user.dto';
import { UserWithRoles } from './dto/user-response.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
    ) {}

    async createUser(dto: CreateUserDTO): Promise<UserWithRoles> {
        const encryptedEmail = this.encryptionService.encrypt(dto.email);
        const hashedPassword = await hash(dto.password, 10);

        let track = await this.prisma.track.findUnique({
            where: { name: dto.name },
        });

        if (!track) {
            track = await this.prisma.track.create({
                data: { name: dto.track },
            });
        }

        const user = await this.prisma.user.create({
            data: {
                email: encryptedEmail,
                password: hashedPassword,
                name: dto.name,
                trackId: track.id,
                userRoles: {
                    create: [{ role: dto.role }],
                },
            },
            include: {
                track: true,
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });
        return {
            id: user.id,
            email: this.encryptionService.decrypt(user.email),
            name: user.name,
            track: user.track ? user.track.name : null,
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async findAll(): Promise<UserWithRoles[]> {
        const users = await this.prisma.user.findMany({
            include: {
                track: true,
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        return users.map((user) => ({
            id: user.id,
            email: this.encryptionService.decrypt(user.email),
            name: user.name,
            track: user.track ? user.track.name : null,
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    }

    async findOne(id: number): Promise<UserWithRoles> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                track: true,
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            id: user.id,
            email: this.encryptionService.decrypt(user.email),
            name: user.name,
            track: user.track ? user.track.name : null,
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async updateUser(
        id: number,
        updateData: { name?: string; email?: string },
    ): Promise<UserWithRoles> {
        const dataToUpdate: Partial<User> = { ...updateData };

        if (updateData.email) {
            dataToUpdate.email = this.encryptionService.encrypt(updateData.email);
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
            include: {
                track: true,
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        return {
            id: user.id,
            email: this.encryptionService.decrypt(user.email),
            name: user.name,
            track: user.track ? user.track.name : null,
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async removeRole(userId: number, role: UserRole): Promise<UserWithRoles> {
        const userRole = await this.prisma.userRoleLink.findUnique({
            where: {
                userId_role: {
                    userId: userId,
                    role: role,
                },
            },
        });

        if (!userRole) {
            throw new NotFoundException('User does not have this role');
        }

        // Desativar role em vez de deletar (para auditoria)
        await this.prisma.userRoleLink.update({
            where: { userId_role: { userId: userId, role: role } },
            data: { isActive: false },
        });

        return await this.findOne(userId);
    }

    async getUserRoles(userId: number): Promise<UserRole[]> {
        const userRoles = await this.prisma.userRoleLink.findMany({
            where: {
                userId: userId,
                isActive: true,
            },
            select: { role: true },
        });

        return userRoles.map((ur) => ur.role);
    }

    async assignRole(userId: number, role: UserRole, assignedBy: number): Promise<UserWithRoles> {
        const existingRole = await this.prisma.userRoleLink.findUnique({
            where: {
                userId_role: {
                    userId: userId,
                    role: role,
                },
            },
        });

        if (existingRole) {
            if (existingRole.isActive) {
                throw new ConflictException('Usuário já possui esta função');
            } else {
                await this.prisma.userRoleLink.update({
                    where: {
                        userId_role: {
                            userId: userId,
                            role: role,
                        },
                    },
                    data: {
                        isActive: true,
                        assignedBy,
                    },
                });
            }
        } else {
            await this.prisma.userRoleLink.create({
                data: {
                    userId,
                    role,
                    isActive: true,
                    assignedBy,
                },
            });
        }
        return this.findOne(userId);
    }

    async deleteUser(id: number): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        // Com cascade configurado no Prisma, apenas deletar o usuário
        await this.prisma.user.delete({
            where: { id },
        });

        return { message: 'Usuário deletado com sucesso' };
    }

    async findByName(name: string): Promise<UserWithRoles[]> {
        const users = await this.prisma.user.findMany({
            where: { name: { contains: name, mode: 'insensitive' } },
            include: {
                track: true,
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        return users.map((user) => ({
            id: user.id,
            email: this.encryptionService.decrypt(user.email),
            name: user.name,
            track: user.track ? user.track.name : null,
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    }

    async findByEmail(email: string): Promise<UserWithRoles | null> {
        // Buscar todos os usuários e comparar emails descriptografados
        const users = await this.prisma.user.findMany({
            include: {
                track: true,
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        // Encontrar o usuário com email correspondente
        const user = users.find((u) => this.encryptionService.decrypt(u.email) === email);

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            email: this.encryptionService.decrypt(user.email),
            name: user.name,
            track: user.track ? user.track.name : null,
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async bulkCreateUsers(dtos: CreateUserDTO[]) {
        if (!dtos.length) throw new BadRequestException('Nenhum usuário para importar');

        const results: Array<
            | { success: true; user: UserWithRoles }
            | { success: false; email: string; error: string }
        > = [];

        return this.prisma.$transaction(async (tx) => {
            for (const dto of dtos) {
                try {
                    const encryptedEmail = this.encryptionService.encrypt(dto.email);
                    const hashedPassword = await hash(dto.password, 10);

                    let track = await tx.track.findUnique({
                        where: { name: dto.track },
                    });

                    if (!track) {
                        track = await tx.track.create({
                            data: { name: dto.track },
                        });
                    }

                    const user = await tx.user.create({
                        data: {
                            email: encryptedEmail,
                            password: hashedPassword,
                            name: dto.name,
                            trackId: track.id,
                            userRoles: {
                                create: [{ role: dto.role }],
                            },
                        },
                        include: {
                            track: true,
                            userRoles: {
                                where: { isActive: true },
                                select: { role: true },
                            },
                        },
                    });

                    results.push({
                        success: true,
                        user: {
                            id: user.id,
                            email: this.encryptionService.decrypt(user.email),
                            name: user.name,
                            track: user.track ? user.track.name : null,
                            roles: user.userRoles.map((ur) => ur.role),
                            createdAt: user.createdAt,
                            updatedAt: user.updatedAt,
                        },
                    });
                } catch (err) {
                    results.push({
                        success: false,
                        email: dto.email,
                        error: err.message,
                    });
                }
            }
            return results;
        });
    }
}
