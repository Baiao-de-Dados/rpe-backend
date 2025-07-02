import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { ImportUsersService } from './import-users.service';
import { ApiImportUsers } from './swagger/import-users.swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RequireAdmin } from '../../auth/decorators/roles.decorator';

@ApiTags('Importação')
@Controller('import/users')
export class ImportUsersController {
    constructor(private readonly importUsersService: ImportUsersService) {}

    @RequireAdmin() // Apenas usuários com o papel ADMIN podem acessar
    @UseGuards(JwtAuthGuard, RolesGuard) // Protege o endpoint com autenticação e verificação de roles
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiImportUsers()
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Arquivo Excel contendo os dados dos usuários (apenas .xlsx)',
                },
            },
        },
    })
    async importUsers(@UploadedFile() file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado.');
        }

        // Verifica se o arquivo é do tipo xlsx
        if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            throw new BadRequestException('O arquivo enviado deve ser do tipo .xlsx');
        }

        return this.importUsersService.importUsersFromExcel(file);
    }
}
