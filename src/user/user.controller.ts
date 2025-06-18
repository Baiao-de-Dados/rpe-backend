import { Controller, Post, Body, Get, Param, Put, Delete, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserResponseDTO } from './dto/user-response.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';

@UseInterceptors(EncryptionInterceptor)
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@Body() createUserDTO: CreateUserDTO) {
        return this.userService.createUser(createUserDTO);
    }

    @Get()
    findAll() {
        return this.userService.findAllUsers();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.userService.findUserById(+id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() UpdateUserDTO: UpdateUserDTO,
    ): Promise<UserResponseDTO> {
        return this.userService.updateUser(+id, UpdateUserDTO);
    }

    @Delete(':id')
    delete(@Param('id') id: string): Promise<{ message: string }> {
        return this.userService.deleteUser(+id);
    }
}
