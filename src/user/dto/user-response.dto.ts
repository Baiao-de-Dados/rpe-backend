import { User as PrismaUser } from '@prisma/client';

export class UserResponseDTO {
    id: number;
    email: string;
    name?: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(user: PrismaUser | Omit<PrismaUser, 'password'>) {
        this.id = user.id;
        this.email = user.email;
        this.name = user.name ?? undefined;
        this.role = user.roleType;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}
