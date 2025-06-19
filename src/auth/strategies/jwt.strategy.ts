import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRoleEnum } from '@prisma/client';

export interface JwtPayload {
    sub: number;
    email: string;
    iat?: number;
    exp?: number;
}

export interface UserFromJwt {
    id: number;
    email: string;
    name: string | null;
    roles: UserRoleEnum[];
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret-key',
        });
    }

    async validate(payload: JwtPayload): Promise<UserFromJwt> {
        const { sub: userId } = payload;

        // Buscar usuário com suas roles ativas
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    where: {
                        isActive: true,
                    },
                    select: {
                        role: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Verificar se o usuário tem pelo menos uma role ativa
        if (!user.userRoles || user.userRoles.length === 0) {
            throw new UnauthorizedException('User has no active roles');
        }

        // Extrair apenas as roles para o objeto de retorno
        const roles = user.userRoles.map((userRole) => userRole.role);

        // Retornar usuário com roles para os guards
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: roles,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
