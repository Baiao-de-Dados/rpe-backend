import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequireAdmin } from './decorators/roles.decorator';
import { UserFromJwt } from './strategies/jwt.strategy';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './guards/roles.guard';

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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Login de usuário' })
    @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Get('me')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obter perfil do usuário logado' })
    @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
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
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Criar novo usuário (apenas admin)' })
    @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
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
    @ApiOperation({ summary: 'Configurar primeiro admin do sistema' })
    @ApiResponse({ status: 201, description: 'Admin criado com sucesso' })
    @ApiResponse({ status: 409, description: 'Admin já existe' })
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
