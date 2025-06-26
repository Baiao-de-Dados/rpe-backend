import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class AssignRoleDto {
    @ApiProperty({
        enum: UserRole,
        description: 'Role a ser atribuída ao usuário',
        example: UserRole.EMPLOYER,
    })
    @IsNotEmpty({ message: 'Role é obrigatória' })
    @IsEnum(UserRole, { message: 'Role deve ser um valor válido' })
    role: UserRole;
}
