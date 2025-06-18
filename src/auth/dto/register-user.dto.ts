import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRoleEnum } from '@prisma/client';

export class RegisterUserDTO {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(UserRoleEnum)
    roleType?: UserRoleEnum;
}
