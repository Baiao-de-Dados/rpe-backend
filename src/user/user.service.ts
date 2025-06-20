import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from 'src/crypto/encryption.service';
import { User, UserRoleEnum } from '@prisma/client';

export interface UserWithRoles {
    id: number;
    email: string;
    name: string | null;
    roles: UserRoleEnum[];
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
    ) {}

    async findAll(): Promise<UserWithRoles[]> {
        const users = (await this.prisma.user.findMany({
            include: {
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        })) as Array<{
            id: number;
            email: string;
            name: string | null;
            userRoles: { role: UserRoleEnum }[];
            createdAt: Date;
            updatedAt: Date;
        }>;

        return users.map((user) => ({
            id: user.id,
            email: this.encryptionService.decrypt(user.email),
            name: user.name,
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    }

    async findOne(id: number): Promise<UserWithRoles> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
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
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        user.email = this.encryptionService.decrypt(user.email);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async removeRole(userId: number, role: UserRoleEnum): Promise<UserWithRoles> {
        const userRole = await this.prisma.userRole.findUnique({
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
        await this.prisma.userRole.update({
            where: { id: userRole.id },
            data: { isActive: false },
        });

        return this.findOne(userId);
    }

    async getUserRoles(userId: number): Promise<UserRoleEnum[]> {
        const userRoles = await this.prisma.userRole.findMany({
            where: {
                userId: userId,
                isActive: true,
            },
            select: { role: true },
        });

        return userRoles.map((ur) => ur.role);
    }

    async assignRole(
        userId: number,
        role: UserRoleEnum,
        assignedBy: number,
    ): Promise<UserWithRoles> {
        const existingRole = await this.prisma.userRole.findUnique({
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
                await this.prisma.userRole.update({
                    where: { id: existingRole.id },
                    data: { isActive: true, assignedBy },
                });
            }
        } else {
            await this.prisma.userRole.create({
                data: {
                    userId,
                    role,
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
        await this.prisma.user.delete({ where: { id } });
        return { message: 'Usuário deletado com sucesso' };
    }

    async findByName(name: string): Promise<UserWithRoles[]> {
        const users = await this.prisma.user.findMany({
            where: { name: { contains: name, mode: 'insensitive' } },
            include: {
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
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    }

    async findByEmail(email: string): Promise<UserWithRoles | null> {
        // Buscar todos os usuários e comparar emails descriptografados
        const users = await this.prisma.user.findMany({
            include: {
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
            roles: user.userRoles.map((ur) => ur.role),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
