import { Body, Controller, Get, Post } from '@nestjs/common';
import { ErpSyncDto } from './dto/erp-sync.dto';
import { ErpService } from './erp.service';
import { OnlyAdmin } from 'src/auth/decorators/roles.decorator';

@OnlyAdmin()
@Controller('erp')
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
