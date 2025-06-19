import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequireAdmin } from './decorators/roles.decorator';
import { UserFromJwt } from './strategies/jwt.strategy';
import { UserRoleEnum } from '@prisma/client';

export class LoginDto {
    email: string;
    password: string;
}

export class CreateUserDto {
    email: string;
    password: string;
    name: string;
    roles: UserRoleEnum[];
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Get('me')
    getProfile(@CurrentUser() user: UserFromJwt) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    @RequireAdmin()
    @Post('create-user')
    async createUser(@Body() createUserDto: CreateUserDto, @CurrentUser() admin: UserFromJwt) {
        return this.authService.createUserWithRoles(
            createUserDto.email,
            createUserDto.password,
            createUserDto.name,
            createUserDto.roles,
            admin.id,
        );
    }

    @Public()
    @Post('setup-admin')
    async setupAdmin() {
        // Verificar se já existe um admin
        const existingAdmin = await this.authService.findAdminUser();

        if (existingAdmin && existingAdmin.userRoles.length > 0) {
            return { message: 'Admin already exists' };
        }

        // Criar primeiro admin
        const admin = await this.authService.createUserWithRoles(
            'admin@test.com',
            'admin123',
            'System Admin',
            [UserRoleEnum.ADMIN],
            1, // Self-assigned
        );

        return {
            message: 'Admin created successfully',
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                roles: admin.roles,
            },
        };
    }
}
