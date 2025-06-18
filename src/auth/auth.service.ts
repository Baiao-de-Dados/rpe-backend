import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { LoginResponseDto } from './dto/login-response.dto';

type UserPublic = Omit<User, 'password'>;

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    /**
     * @param email
     * @param password
     * @returns Objeto do usuário sem a senha, ou null se a validação for inválida.
     */
    async validateUser(email: string, password: string): Promise<UserPublic | null> {
        try {
            const user = await this.prisma.user.findUnique({ where: { email } });

            if (
                user &&
                typeof user.password === 'string' &&
                (await bcrypt.compare(password, user.password))
            ) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password, ...rest } = user;
                return rest;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * @param email
     * @param password
     * @returns Objeto contendo o token de acesso e os dados do usuário.
     */

    async login(email: string, password: string): Promise<LoginResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: passwordHash, ...rest } = user;

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: rest,
        };
    }

    /**
     * @param email
     * @param password
     * @param name (opcional)
     * @returns O objeto do usuário criado, sem a senha.
     */
    async register(email: string, password: string, name?: string) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new UnauthorizedException('Email already exists');
        }

        // Criptografa a senha antes de salvar
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: senha, ...rest } = user;
        return rest;
    }
}
