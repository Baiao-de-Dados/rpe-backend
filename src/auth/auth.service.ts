import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from 'src/encryption/encryption.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface UserPublic {
    id: number;
    email: string;
    name: string | null;
    roles: UserRole[];
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private encryptionService: EncryptionService,
    ) {}

    async validateUser(email: string, password: string): Promise<UserPublic | null> {
        try {
            // Buscar todos os usuários e descriptografar os emails
            const users = await this.prisma.user.findMany({
                include: {
                    userRoles: {
                        where: { isActive: true },
                        select: { role: true },
                    },
                },
            });

            // Encontrar o usuário pelo email descriptografado
            const user = users.find((u) => {
                try {
                    const decryptedEmail = this.encryptionService.decrypt(u.email);
                    return decryptedEmail === email;
                } catch {
                    return false;
                }
            });

            if (
                user &&
                typeof user.password === 'string' &&
                (await bcrypt.compare(password, user.password))
            ) {
                const roles = user.userRoles.map((ur) => ur.role);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password, userRoles, ...result } = user;
                return { ...result, roles, email };
            }
            return null;
        } catch {
            return null;
        }
    }

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        // Incluir roles no payload para o JWT
        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async logout(userId: number): Promise<{ message: string; data: UserPublic }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { lastLogged: new Date() },
        });

        const userRoles = user.userRoles.map((ur) => ur.role);
        const userData: UserPublic = {
            id: user.id,
            email: this.encryptionService.decrypt(user.email),
            name: user.name,
            roles: userRoles,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return {
            message: 'Logout successful',
            data: userData,
        };
    }

    async findAdminUser() {
        return await this.prisma.user.findFirst({
            include: {
                userRoles: {
                    where: { role: UserRole.ADMIN, isActive: true },
                },
            },
        });
    }

    async createUserWithRoles(
        email: string,
        password: string,
        name: string,
        roles: UserRole[],
        assignedBy?: number,
    ): Promise<UserPublic> {
        const encryptedEmail = this.encryptionService.encrypt(email);

        // Verificar se usuário já existe
        const existingUser = await this.prisma.user.findUnique({
            where: { email: encryptedEmail },
        });

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await this.prisma.$transaction(async (tx) => {
            // Verificar se assignedBy existe (apenas se fornecido)
            if (assignedBy) {
                const superAdmin = await tx.user.findUnique({
                    where: {
                        id: assignedBy,
                    },
                });
                if (!superAdmin) {
                    throw new NotFoundException('Super-admin não existe');
                }
            }

            // Criar usuário
            const newUser = await tx.user.create({
                data: {
                    email: encryptedEmail,
                    password: hashedPassword,
                    name,
                },
            });

            // Criar roles do usuário
            await tx.userRoleLink.createMany({
                data: roles.map((role) => ({
                    userId: newUser.id,
                    role,
                    assignedBy: assignedBy || null, // Usar null se não fornecido
                    createdAt: new Date(),
                })),
            });

            // Buscar usuário com roles
            return await tx.user.findUnique({
                where: { id: newUser.id },
                include: {
                    userRoles: {
                        where: { isActive: true },
                        select: { role: true },
                    },
                },
            });
        });

        const userRoles = result!.userRoles.map((ur) => ur.role);

        return {
            id: result!.id,
            email,
            name: result!.name,
            createdAt: result!.createdAt,
            updatedAt: result!.updatedAt,
            roles: userRoles,
        };
    }
}
