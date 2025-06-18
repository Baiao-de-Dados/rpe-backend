import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserResponseDTO } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async createUser(data: CreateUserDTO): Promise<UserResponseDTO> {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });
        return new UserResponseDTO(user);
    }

    async findAllUsers(): Promise<UserResponseDTO[]> {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                roleType: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return users.map((user) => new UserResponseDTO(user));
    }

    async findUserById(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                roleType: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return new UserResponseDTO(user);
    }

    async updateUser(id: number, data: UpdateUserDTO): Promise<UserResponseDTO> {
        if (data.password && typeof data.password === 'string') {
            data.password = await bcrypt.hash(data.password, 10);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                roleType: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return new UserResponseDTO(user);
    }

    async deleteUser(id: number): Promise<{ message: string }> {
        await this.prisma.user.delete({ where: { id } });
        return { message: 'User deleted sucessfully' };
    }
}
