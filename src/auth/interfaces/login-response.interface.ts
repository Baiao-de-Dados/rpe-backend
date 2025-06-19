import { User } from '@prisma/client';

type UserPublic = Omit<User, 'password'>;

export interface LoginResponse {
    access_token: string;
    user: UserPublic;
}
