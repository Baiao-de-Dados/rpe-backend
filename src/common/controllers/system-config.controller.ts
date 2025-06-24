import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from '../services/system-config.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRoleEnum } from '@prisma/client';

@Controller('system-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemConfigController {
    constructor(private systemConfigService: SystemConfigService) {}

    @Get('current-cycle')
    async getCurrentCycle() {
        return {
            currentCycle: await this.systemConfigService.getCurrentCycle(),
        };
    }

    @Post('current-cycle')
    @Roles(UserRoleEnum.RH, UserRoleEnum.ADMIN)
    async setCurrentCycle(@Body() body: { cycle: string }) {
        await this.systemConfigService.setCurrentCycle(body.cycle);
        return {
            message: 'Ciclo atual atualizado com sucesso',
            currentCycle: body.cycle,
        };
    }

    @Get('cycles')
    async getAllCycles() {
        return {
            cycles: await this.systemConfigService.getAllCycles(),
        };
    }

    @Get('config/:key')
    @Roles(UserRoleEnum.RH, UserRoleEnum.ADMIN)
    async getConfig(@Body() body: { key: string }) {
        return {
            key: body.key,
            value: await this.systemConfigService.getConfig(body.key),
        };
    }

    @Post('config')
    @Roles(UserRoleEnum.RH, UserRoleEnum.ADMIN)
    async setConfig(@Body() body: { key: string; value: string; description?: string }) {
        await this.systemConfigService.setConfig(body.key, body.value, body.description);
        return {
            message: 'Configuração atualizada com sucesso',
            key: body.key,
            value: body.value,
        };
    }
}
