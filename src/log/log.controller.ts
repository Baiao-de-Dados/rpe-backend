import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { FindLogsQueryDto } from './dto/log.dto';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiAuth()
export class LogController {
    constructor(private readonly logService: LogService) {}

    @Get()
    async findAll(@Query() query: FindLogsQueryDto) {
        const pageNum = query.page || 1;
        const sizeNum = query.pageSize || 50;

        return this.logService.findAll({
            page: pageNum,
            pageSize: sizeNum,
            action: query.action,
            search: query.search,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            order: query.order || 'desc',
        });
    }
}
