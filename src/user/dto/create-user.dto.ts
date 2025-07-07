import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsNumber } from 'class-validator';
import { UserRole } from '@prisma/client';
import { EncryptField } from 'src/cryptography/decorators/encrypt-field.decorator';

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
    position: string;

    @IsNotEmpty()
    @IsString()
    track: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsNotEmpty()
    @IsNumber()
    mentorId: number;

    @IsNotEmpty()
    @IsNumber()
    trackId: number;
}
