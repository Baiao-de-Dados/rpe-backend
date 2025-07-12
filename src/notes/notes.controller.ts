import { Controller, Body, Param, Post, Get } from '@nestjs/common';
import { NotesService } from './notes.service';
import {
    UpsertNoteDto,
    GetNoteDto,
    NoteResponseDto,
    NoteSuccessResponseDto,
} from './dto/notes.dto';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiBody,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('notes')
export class NotesController {
    constructor(private readonly notesService: NotesService) {}

    @Post(':userId')
    @ApiOperation({ summary: 'Cria ou edita anotação de um usuário' })
    @ApiParam({ name: 'userId', type: Number, description: 'ID do usuário' })
    @ApiBody({ type: UpsertNoteDto })
    @ExactRoles(UserRole.EMPLOYER)
    @ApiResponse({
        status: 201,
        description: 'Anotação criada/atualizada com sucesso.',
        type: NoteSuccessResponseDto,
    })
    async createOrUpdateNote(@Param('userId') userId: number, @Body() body: UpsertNoteDto) {
        await this.notesService.upsertNote(userId, body.notes);
        return { message: 'Anotação criada/atualizada com sucesso.' };
    }

    @Get(':userId')
    @ApiOperation({ summary: 'Busca anotação de um usuário' })
    @ApiParam({ name: 'userId', type: Number, description: 'ID do usuário' })
    @ApiResponse({ status: 200, description: 'Anotação encontrada.', type: NoteResponseDto })
    @ExactRoles(UserRole.EMPLOYER)
    async getNote(@Param() params: GetNoteDto) {
        return await this.notesService.getNoteByUserId(params.userId);
    }
}
