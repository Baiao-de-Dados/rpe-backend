import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequireAdmin } from './decorators/roles.decorator';
import { UserFromJwt } from './strategies/jwt.strategy';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './guards/roles.guard';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { ApiCreate, ApiGet } from 'src/common/decorators/api-crud.decorator';
import { ApiStandardResponses } from 'src/common/decorators/api-standard-responses.decorator';

export class LoginDto {
    email: string;
    password: string;
}

export class CreateUserDto {
    email: string;
    password: string;
    name: string;
    roles: UserRole[];
}

@ApiAuth()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('login')
    @ApiStandardResponses()
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Public()
    @Post('logout')
    @ApiStandardResponses()
    async logout(@CurrentUser() user: UserFromJwt) {
        return this.authService.logout(user.id);
    }

    @Get('me')
    @ApiGet('perfil')
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
    @UseGuards(RolesGuard)
    @Post('create-user')
    @ApiCreate('usuário')
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
    @ApiCreate('admin')
    @ApiStandardResponses()
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
            [UserRole.ADMIN],
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
