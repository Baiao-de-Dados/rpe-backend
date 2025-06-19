import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'usuario@exemplo.com',
        description: 'Email do usuário',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'senha123',
        description: 'Senha do usuário',
    })
    @IsString()
    @MinLength(6)
    password: string;
}
