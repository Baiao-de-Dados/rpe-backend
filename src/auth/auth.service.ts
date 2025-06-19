import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from 'src/crypto/encryption.service';
import { UserRoleEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface UserPublic {
    id: number;
    email: string;
    name: string | null;
    roles: UserRoleEnum[];
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
            const encryptedEmail = this.encryptionService.encrypt(email);
            const user = await this.prisma.user.findUnique({
                where: { email: encryptedEmail },
                include: {
                    userRoles: {
                        where: { isActive: true },
                        select: { role: true },
                    },
                },
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

        const payload = { sub: user.id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user: user,
        };
    }

    async findAdminUser() {
        return await this.prisma.user.findFirst({
            include: {
                userRoles: {
                    where: { role: UserRoleEnum.ADMIN, isActive: true },
                },
            },
        });
    }

    async createUserWithRoles(
        email: string,
        password: string,
        name: string,
        roles: UserRoleEnum[],
        assignedBy: number,
    ): Promise<UserPublic> {
        const encryptedEmail = this.encryptionService.encrypt(email);

        // Verificar se usuário já existe
        const existingUser = await this.prisma.user.findUnique({
            where: { email: encryptedEmail },
        });

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar usuário e suas roles em uma transação
        const result = await this.prisma.$transaction(async (tx) => {
            // Criar usuário
            const user = await tx.user.create({
                data: {
                    email: encryptedEmail,
                    password: hashedPassword,
                    name,
                },
            });

            // Criar roles do usuário
            await tx.userRole.createMany({
                data: roles.map((role) => ({
                    userId: user.id,
                    role: role,
                    assignedBy: assignedBy,
                })),
            });

            // Buscar usuário com roles
            return await tx.user.findUnique({
                where: { id: user.id },
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
