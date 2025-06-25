import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from '../services/system-config.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OnlyAdmin } from '../../auth/decorators/roles.decorator';
import { ApiAuth } from '../decorators/api-auth.decorator';
import { SetCurrentCycleDto } from '../dto/set-current-cycle.dto';
import { SetConfigDto } from '../dto/set-config.dto';

@ApiAuth()
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
    @OnlyAdmin()
    async setCurrentCycle(@Body() body: SetCurrentCycleDto) {
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
    @OnlyAdmin()
    async getConfig(@Body() body: { key: string }) {
        return {
            key: body.key,
            value: await this.systemConfigService.getConfig(body.key),
        };
    }

    @Post('config')
    @OnlyAdmin()
    async setConfig(@Body() body: SetConfigDto) {
        await this.systemConfigService.setConfig(body.key, body.value, body.description);
        return {
            message: 'Configuração atualizada com sucesso',
            key: body.key,
            value: body.value,
        };
    }
}
