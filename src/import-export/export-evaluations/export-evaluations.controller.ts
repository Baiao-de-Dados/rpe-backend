import { Controller, Get, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { ExportEvaluationsService } from './export-evaluations.service';
//import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
//import { RolesGuard } from '../../auth/guards/roles.guard';
//import { RequireCommittee } from '../../auth/decorators/roles.decorator';
import { ApiExportEvaluations } from './swagger/export-evaluations.swagger';
import { ValidateExportEvaluationsDto } from './dto/validate-export-evaluations.dto';
import { QueryValidationPipe } from '../../common/pipes/query-validation.pipe';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { RequireEmployer } from 'src/auth/decorators/roles.decorator';

@ApiAuth()
@ApiTags('Exportação')
@Controller('export/evaluations')
export class ExportEvaluationsController {
    constructor(private readonly exportEvaluationsService: ExportEvaluationsService) {}

    //@RequireCommittee()
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireEmployer()
    @Get()
    @ApiExportEvaluations()
    async exportEvaluations(
        @Query(new QueryValidationPipe()) query: ValidateExportEvaluationsDto,
        @Res() res: Response,
    ): Promise<void> {
        const buffer = await this.exportEvaluationsService.generateExport(query.cycleId);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename=evaluations.xlsx');
        res.send(buffer);
    }
}
