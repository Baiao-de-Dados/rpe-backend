import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    UnauthorizedException,
    UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/strategies/jwt.strategy';
import { UserRole } from '@prisma/client';
import { AssignRoleDto } from './dto/assign-role.dto';

import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import {
    ApiCreate,
    ApiList,
    ApiGet,
    ApiUpdate,
    ApiDelete,
} from 'src/common/decorators/api-crud.decorator';
import { ApiProfile, ApiAssignRole, ApiRemoveRole } from './decorators/api-user.decorator';
import {
    RequireAdmin,
    RequireRH,
    RequireManager,
    OnlyAdmin,
    Roles,
} from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UserImportService } from 'src/imports/user/user-import.service';

export class UpdateUserDto {
    name?: string;
    email?: string;
}

@ApiTags('Users')
@ApiAuth()
@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly userImportService: UserImportService,
    ) {}

    @OnlyAdmin()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @ApiCreate('usuário')
    async create(@Body() dto: CreateUserDTO) {
        return this.userService.createUser(dto);
    }

    @RequireRH()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    @ApiList('usuários')
    async findAll() {
        return this.userService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiProfile()
    async getOwnProfile(@CurrentUser() user: UserFromJwt) {
        if (!user || !user.id) {
            throw new UnauthorizedException('Usuário não autenticado');
        }
        return this.userService.findOne(user.id);
    }

    @RequireAdmin()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post(':id/roles')
    @ApiAssignRole()
    async assignRole(
        @Param('id', ParseIntPipe) userId: number,
        @Body() assignRoleDto: AssignRoleDto,
        @CurrentUser() admin: UserFromJwt,
    ) {
        if (!admin || !admin.id) {
            throw new UnauthorizedException('Admin não autenticado');
        }
        return this.userService.assignRole(userId, assignRoleDto.role, admin.id);
    }

    @RequireAdmin()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id/roles/:role')
    @ApiRemoveRole()
    async removeRole(@Param('id', ParseIntPipe) userId: number, @Param('role') role: UserRole) {
        return this.userService.removeRole(userId, role);
    }

    @Roles(UserRole.RH, UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(':id')
    @ApiGet('usuário')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @RequireManager()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    @ApiUpdate('usuário')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(id, updateUserDto);
    }

    @OnlyAdmin()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @ApiDelete('usuário')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.userService.deleteUser(id);
    }

    @OnlyAdmin()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('import')
    @ApiCreate('usuários importados')
    async importUser(@UploadedFile() file: Express.Multer.File) {
        const dtos = await this.userImportService.parseExcel(file.buffer);
        return this.userService.bulkCreateUsers(dtos);
    }
}
