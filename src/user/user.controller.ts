import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
    RequireAdmin,
    RequireRH,
    RequireManager,
    OnlyAdmin,
    Roles,
} from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/strategies/jwt.strategy';
import { UserRoleEnum } from '@prisma/client';

export class UpdateUserDto {
    name?: string;
    email?: string;
}

export class AssignRoleDto {
    role: UserRoleEnum;
}

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @RequireRH()
    @Get()
    @ApiOperation({ summary: 'Listar todos os usuários (apenas RH e Admin)' })
    @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    async findAll() {
        return this.userService.findAll();
    }

    @Get('profile')
    @ApiOperation({ summary: 'Obter perfil do usuário logado' })
    @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    async getOwnProfile(@CurrentUser() user: UserFromJwt) {
        return this.userService.findOne(user.id);
    }

    @Roles(UserRoleEnum.RH, UserRoleEnum.ADMIN)
    @Get(':id')
    @ApiOperation({ summary: 'Obter usuário por ID (apenas RH e Admin)' })
    @ApiResponse({ status: 200, description: 'Usuário encontrado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async findOne(@Param('id') id: string) {
        return this.userService.findOne(+id);
    }

    @RequireManager()
    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar usuário (apenas Manager e superiores)' })
    @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(+id, updateUserDto);
    }

    @OnlyAdmin()
    @Delete(':id')
    @ApiOperation({ summary: 'Deletar usuário (apenas Admin)' })
    @ApiResponse({ status: 200, description: 'Usuário deletado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async remove(@Param('id') id: string) {
        return this.userService.deleteUser(+id);
    }

    @RequireAdmin()
    @Post(':id/roles')
    @ApiOperation({ summary: 'Atribuir role a usuário (apenas Admin)' })
    @ApiResponse({ status: 200, description: 'Role atribuída com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async assignRole(
        @Param('id') userId: string,
        @Body() body: AssignRoleDto,
        @CurrentUser() admin: UserFromJwt,
    ) {
        return this.userService.assignRole(+userId, body.role, admin.id);
    }

    @RequireAdmin()
    @Delete(':id/roles/:role')
    @ApiOperation({ summary: 'Remover role de usuário (apenas Admin)' })
    @ApiResponse({ status: 200, description: 'Role removida com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async removeRole(@Param('id') userId: string, @Param('role') role: UserRoleEnum) {
        return this.userService.removeRole(+userId, role);
    }
}
