import { Controller, Get, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { Log } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LogController {
    constructor(private readonly logService: LogService) {}

    @Get()
    async findAll(): Promise<Log[]> {
        return this.logService.findAll();
    }
}
