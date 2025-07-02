import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../encryption/encryption.service';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';

export interface JwtPayload {
    sub: number;
    email: string;
    roles?: UserRole[];
    track?: string | null;
    iat?: number;
    exp?: number;
}

export interface UserFromJwt {
    id: number;
    email: string;
    name: string | null;
    roles: UserRole[];
    track: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const FALL_BACK_JWT_SECRET = crypto.randomBytes(32).toString('base64');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || FALL_BACK_JWT_SECRET,
        });
    }

    async validate(payload: JwtPayload): Promise<UserFromJwt> {
        const { sub: userId, roles: payloadRoles, track } = payload;

        console.log('JWT Strategy - Validating token with payload:', {
            userId,
            payloadHasRoles: !!payloadRoles,
            track,
        });

        // Buscar o usuário somente pelo ID
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    where: { isActive: true },
                    select: { role: true },
                },
                track: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Usar roles do payload se disponíveis, caso contrário extrair do banco
        const roles = payloadRoles || user.userRoles.map((userRole) => userRole.role);

        console.log('JWT Strategy - Using roles:', roles);

        // Descriptografar email para retorno
        const decryptedEmail = this.encryptionService.decrypt(user.email);

        return {
            id: user.id,
            email: decryptedEmail,
            name: user.name,
            roles,
            track:
                track !== undefined
                    ? track
                    : user.track && typeof user.track === 'object'
                      ? user.track.name
                      : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
