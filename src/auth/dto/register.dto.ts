import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'novo@exemplo.com',
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

    @ApiProperty({
        example: 'Nome do Usuário',
        description: 'Nome do usuário',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;
}
