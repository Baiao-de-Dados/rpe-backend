import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErpService } from './erp.service';
import { ErpExportResponseDto } from './dto/erp-export.dto';
import { ApiAuth } from '../decorators/api-auth.decorator';
import { RequireRH } from '../../auth/decorators/roles.decorator';

@ApiTags('ERP')
@ApiAuth()
@Controller('export')
export class ErpController {
    constructor(private readonly erpService: ErpService) {}

    @RequireRH()
    @Get('erp')
    @ApiOperation({
        summary: 'Exportar dados para ERP',
        description: 'Retorna dados dos usuários e seus projetos para integração com ERP',
    })
    @ApiResponse({
        status: 200,
        description: 'Dados exportados com sucesso',
        type: ErpExportResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    async exportErp(): Promise<ErpExportResponseDto> {
        return this.erpService.exportErpData();
    }
}
