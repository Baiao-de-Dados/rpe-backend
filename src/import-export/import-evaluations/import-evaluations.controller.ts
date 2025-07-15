import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { ImportEvaluationsService } from './import-evaluations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RequireRH } from '../../auth/decorators/roles.decorator';
import { ApiImportEvaluations } from './swagger/import-evaluations.swagger';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';

@ApiAuth()
@ApiTags('Importação')
@Controller('import/evaluations')
export class ImportEvaluationsController {
    constructor(private readonly importEvaluationsService: ImportEvaluationsService) {}

    @RequireRH() // Apenas usuários com o papel RH ou superior podem acessar
    @UseGuards(JwtAuthGuard, RolesGuard) // Protege o endpoint com autenticação e verificação de roles
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiImportEvaluations() // Aplica a documentação do Swagger
    async importEvaluations(@UploadedFile() file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado.');
        }

        // Verifica se o arquivo é do tipo xlsx
        if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            throw new BadRequestException('O arquivo enviado deve ser do tipo .xlsx');
        }

        return this.importEvaluationsService.importEvaluationsFromExcel(file, file.originalname);
    }
}
