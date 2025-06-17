import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';

export class UserResponseDTO {
    id: number;
    email: string;
    name?: string;
    role: PrismaUserRole;
    createdAt: Date;
    updatedAt: Date;

    constructor(user: PrismaUser & { role: PrismaUserRole }) {
        this.id = user.id;
        this.email = user.email;
        this.name = user.name ?? undefined;
        this.role = user.role;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}
