import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class LoginResponseDto {
    @ApiProperty({
        description: 'Token de acesso JWT',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    access_token: string;

    @ApiProperty({
        description: 'Dados do usuário',
        type: 'object',
        properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'usuario@exemplo.com' },
            name: { type: 'string', example: 'Nome do Usuário' },
            createdAt: { type: 'string', example: '2024-03-17T12:00:00Z' },
            updatedAt: { type: 'string', example: '2024-03-17T12:00:00Z' },
        },
    })
    user: Omit<User, 'password'>;
}
