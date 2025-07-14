import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../cryptography/encryption.service';
import { UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { getBrazilDate } from 'src/cycles/utils';

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

        // Buscar dados completos do usuário incluindo track
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: {
                track: true,
            },
        });

        // Incluir roles e track no payload para o JWT
        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles,
            track: fullUser?.track ?? null,
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
            data: { lastLogged: getBrazilDate() },
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
        position: string,
        roles: UserRole[],
        mentorId?: number,
        assignedBy?: number,
    ): Promise<UserPublic> {
        const encryptedEmail = this.encryptionService.encrypt(email);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Verificar se usuário já existe
        const existing = await this.prisma.user.findUnique({
            where: { email: encryptedEmail },
        });

        if (existing) {
            throw new ConflictException('User already exists');
        }

        let defaultTrack = await this.prisma.track.findUnique({ where: { name: 'Default' } });
        if (!defaultTrack) {
            defaultTrack = await this.prisma.track.create({ data: { name: 'Default' } });
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const createUser = await tx.user.create({
                data: {
                    email: encryptedEmail,
                    password: hashedPassword,
                    name,
                    position,
                    ...(mentorId !== undefined ? { mentorId } : {}),
                    trackId: defaultTrack.id,
                },
            });

            const userRoleData: Prisma.UserRoleLinkCreateManyInput[] = roles.map((role) => {
                const data: Prisma.UserRoleLinkCreateManyInput = {
                    userId: createUser.id,
                    role,
                    createdAt: new Date(),
                };
                if (assignedBy !== undefined) {
                    data.assignedBy = assignedBy;
                }
                return data;
            });

            await tx.userRoleLink.createMany({
                data: userRoleData,
            });

            return tx.user.findUnique({
                where: { id: createUser.id },
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
