import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from 'src/crypto/encryption.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserResponseDTO } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
    ) {}

    async createUser(data: CreateUserDTO): Promise<UserResponseDTO> {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const encryptedEmail = this.encryptionService.encrypt(data.email);
        const user = await this.prisma.user.create({
            data: {
                ...data,
                email: encryptedEmail,
                password: hashedPassword,
            },
        });
        user.email = this.encryptionService.decrypt(user.email);
        return new UserResponseDTO(user);
    }

    async findAllUsers(): Promise<UserResponseDTO[]> {
        const users = await this.prisma.user.findMany();
        users.forEach((user) => {
            user.email = this.encryptionService.decrypt(user.email);
        });
        return users.map((user) => new UserResponseDTO(user));
    }

    async findUserById(id: number) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        user.email = this.encryptionService.decrypt(user.email);
        return new UserResponseDTO(user);
    }

    async updateUser(id: number, data: UpdateUserDTO): Promise<UserResponseDTO> {
        if (data.password && typeof data.password === 'string') {
            data.password = await bcrypt.hash(data.password, 10);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data,
        });
        return new UserResponseDTO(user);
    }

    async deleteUser(id: number): Promise<{ message: string }> {
        await this.prisma.user.delete({ where: { id } });
        return { message: 'User deleted sucessfully' };
    }
}
