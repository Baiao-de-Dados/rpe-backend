import { Body, Controller, Get, Post } from '@nestjs/common';
import { ErpSyncDto } from './dto/erp-sync.dto';
import { ErpService } from './erp.service';
import { OnlyAdmin, RequireAdmin } from '../../auth/decorators/roles.decorator';
import { ApiAuth } from '../decorators/api-auth.decorator';

@RequireAdmin()
@Controller('erp')
@ApiAuth()
export class ErpController {
    constructor(private readonly erpService: ErpService) {}

    @Get('export')
    export(): Promise<ErpSyncDto> {
        return this.erpService.buildErpJson();
    }

    @Post('synchronize')
    synchronize(@Body() data: ErpSyncDto) {
        return this.erpService.syncWithErp(data).then(() => ({ success: true }));
    }
}
