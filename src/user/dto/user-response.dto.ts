import { UserRole } from '@prisma/client';
import { Exclude } from 'class-transformer';

export interface UserWithRoles {
    id: number;
    email: string;
    name: string;
    trackId: number;
    roles: UserRole[];
    createdAt: Date;
    updatedAt: Date;
}

export class UserResponseDTO {
    id: number;
    email: string;
    name: string;
    roles: UserRole[];
    track: string | null;
    createdAt: Date;
    updatedAt: Date;
    trackId: number;

    @Exclude()
    password: string;

    constructor(user: UserWithRoles) {
        this.id = user.id;
        this.email = user.email;
        this.name = user.name;
        this.roles = user.roles;
        this.trackId = user.trackId;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}
