import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/strategies/jwt.strategy';
import { UserRole } from '@prisma/client';

import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import {
    ApiList,
    ApiGet,
    ApiCreate,
    ApiUpdate,
    ApiDelete,
} from 'src/common/decorators/api-crud.decorator';
import {
    RequireAdmin,
    RequireRH,
    RequireManager,
    OnlyAdmin,
    Roles,
} from '../auth/decorators/roles.decorator';

export class UpdateUserDto {
    name?: string;
    email?: string;
}

export class AssignRoleDto {
    role: UserRole;
}

@ApiTags('Users')
@ApiAuth()
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @RequireRH()
    @Get()
    @ApiList('usuários')
    async findAll() {
        return this.userService.findAll();
    }

    @Get('profile')
    @ApiGet('perfil do usuário')
    async getOwnProfile(@CurrentUser() user: UserFromJwt) {
        return this.userService.findOne(user.id);
    }

    @Roles(UserRole.RH, UserRole.ADMIN)
    @Get(':id')
    @ApiGet('usuário')
    async findOne(@Param('id') id: string) {
        return this.userService.findOne(+id);
    }

    @RequireManager()
    @Patch(':id')
    @ApiUpdate('usuário')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(+id, updateUserDto);
    }

    @OnlyAdmin()
    @Delete(':id')
    @ApiDelete('usuário')
    async remove(@Param('id') id: string) {
        return this.userService.deleteUser(+id);
    }

    @RequireAdmin()
    @Post(':id/roles')
    @ApiCreate('role ao usuário (apenas Admin)')
    async assignRole(
        @Param('id') userId: string,
        @Body() body: AssignRoleDto,
        @CurrentUser() admin: UserFromJwt,
    ) {
        return this.userService.assignRole(+userId, body.role, admin.id);
    }

    @RequireAdmin()
    @Delete(':id/roles/:role')
    @ApiDelete('role do usuário (apenas Admin)')
    async removeRole(@Param('id') userId: string, @Param('role') role: UserRole) {
        return this.userService.removeRole(+userId, role);
    }
}
