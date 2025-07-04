import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ValidateImportUserDto {
    @ApiProperty({
        example: 'joao.silva@rocketcorp.com',
        description: 'Email do usuário',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'João Silva',
        description: 'Nome completo do usuário',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'Backend',
        description: 'Trilha do usuário',
    })
    @IsString()
    @IsNotEmpty()
    track: string;

    @ApiProperty({
        example: 'EMPLOYER',
        description: 'Cargo ou papel do usuário',
    })
    @IsString()
    @IsNotEmpty()
    role: string;

    @ApiProperty({
        example: 'senha123',
        description: 'Senha do usuário',
    })
    @IsString()
    @MinLength(6)
    password: string;
}
