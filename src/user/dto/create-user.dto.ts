import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class CreateUserDTO {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsString()
    password: string;

    @IsEnum(UserRole)
    role: UserRole;
}
