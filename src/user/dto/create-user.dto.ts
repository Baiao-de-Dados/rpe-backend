import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { EncryptField } from 'src/encryption/decorators/encrypt-field.decorator';

export class CreateUserDTO {
    @EncryptField()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    track: string;

    @IsEnum(UserRole)
    role: UserRole;
}
