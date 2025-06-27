import { PrismaService } from 'src/prisma/prisma.service';
import { RHUserDTO } from '../dto/rh.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class RHUserService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<RHUserDTO[]> {
        const users = await this.prisma.user.findMany({
            where: {
                userRoles: {
                    some: { role: UserRole.RH, isActive: true },
                },
            },
            include: {
                userRoles: true,
            },
        });

        return users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: UserRole.RH,
            isActive: user.userRoles.some((r) => r.role === UserRole.RH && r.isActive),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    }

    async findOne(id: number): Promise<RHUserDTO> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { userRoles: true },
        });

        if (!user || !user.userRoles.some((r) => r.role === UserRole.RH && r.isActive)) {
            throw new NotFoundException('Usuário RH não encontrado');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: UserRole.RH,
            isActive: true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}

// Crud pilar e criterio

// tabela ciclo:
/**
 * id
 * isACtive bool
 *  cycle String
 * createdAt DateTime
 * endDate DateTime
 *
 */
