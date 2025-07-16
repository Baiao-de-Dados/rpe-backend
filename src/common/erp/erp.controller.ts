import { Body, Controller, Get, Post } from '@nestjs/common';
import { ErpSyncDto } from './dto/erp-sync.dto';
import { ErpService } from './erp.service';
import { RequireAdmin } from '../../auth/decorators/roles.decorator';
import { ApiAuth } from '../decorators/api-auth.decorator';
import { ErpProjectDto } from './dto/erp-project.dto';

@RequireAdmin()
@ApiAuth()
@Controller('erp')
@ApiAuth()
export class ErpController {
    constructor(private readonly erpService: ErpService) {}

    @Get('export')
    async export(): Promise<{ projects: ErpProjectDto[] }> {
        const { projects } = await this.erpService.buildErpJson();
        return { projects };
    }

    @Post('synchronize')
    synchronize(@Body() data: ErpSyncDto) {
        return this.erpService.syncWithErp(data).then(() => ({ success: true }));
    }
}
