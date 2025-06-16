import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

type UserPublic = Omit<User, 'password'>;

interface LoginResponse {
    access_token: string;
    user: UserPublic;
}
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
                const { password: _password, ...result } = user;
                return result;
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
    async login(email: string, password: string): Promise<LoginResponse> {
        if (!email || !password) {
            throw new BadRequestException('Email and password are required');
        }

        const user = await this.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    /**
     * @param email
     * @param password
     * @param name (opcional)
     * @returns O objeto do usuário criado, sem a senha.
     */
    async register(email: string, password: string, name?: string) {
        try {
            const existingUser = await this.prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: name || '',
                },
            });

            const { password: _password, ...result } = user;
            return result;
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            function isPrismaUniqueError(err: unknown): err is { code: string } {
                return (
                    typeof err === 'object' &&
                    err !== null &&
                    'code' in err &&
                    typeof (err as { code: string }).code === 'string'
                );
            }
            if (isPrismaUniqueError(error) && error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }
}
