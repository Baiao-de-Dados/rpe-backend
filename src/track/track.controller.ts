import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('tracks')
export class TrackController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    @ExactRoles(UserRole.RH)
    async findAll() {
        return this.prisma.track.findMany({
            select: {
                id: true,
                name: true,
            },
        });
    }
}
