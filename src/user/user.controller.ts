import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @RequireRH()
    @Get()
    async findAll() {
        return this.userService.findAll();
    }

    @Get('profile')
    async getOwnProfile(@CurrentUser() user: UserFromJwt) {
        return this.userService.findOne(user.id);
    }

    @Roles(UserRoleEnum.RH, UserRoleEnum.ADMIN)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.userService.findOne(+id);
    }

    @RequireManager()
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(+id, updateUserDto);
    }

    @OnlyAdmin()
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.userService.deleteUser(+id);
    }

    @RequireAdmin()
    @Post(':id/roles')
    async assignRole(
        @Param('id') userId: string,
        @Body() body: AssignRoleDto,
        @CurrentUser() admin: UserFromJwt,
    ) {
        return this.userService.assignRole(+userId, body.role, admin.id);
    }

    @RequireAdmin()
    @Delete(':id/roles/:role')
    async removeRole(@Param('id') userId: string, @Param('role') role: UserRoleEnum) {
        return this.userService.removeRole(+userId, role);
    }
}
