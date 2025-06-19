import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRoleEnum } from '@prisma/client';
import { EncryptField } from 'src/crypto/decorators/encrypt-field.decorator';

export class CreateUserDTO {
    @EncryptField()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsEnum(UserRoleEnum)
    role: UserRoleEnum;
}
