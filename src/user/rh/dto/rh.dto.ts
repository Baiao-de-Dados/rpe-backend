import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RHUserDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ enum: UserRole, default: UserRole.RH })
    role: UserRole;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
