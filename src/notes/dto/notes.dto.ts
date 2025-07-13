import { ApiProperty } from '@nestjs/swagger';

export class UpsertNoteDto {
    @ApiProperty({ example: 1, description: 'ID do usuário' })
    userId: number;

    @ApiProperty({ example: 'Texto da anotação', description: 'Conteúdo da anotação' })
    notes: string;
}

export class GetNoteDto {
    @ApiProperty({ example: 1, description: 'ID do usuário' })
    userId: number;
}

export class NoteResponseDto {
    @ApiProperty({ example: 'Texto da anotação', description: 'Conteúdo da anotação' })
    notes: string;

    @ApiProperty({ example: '2025-07-11T22:05:52.348Z', description: 'Data da última atualização' })
    updatedAt: Date;
}

export class NoteSuccessResponseDto {
    @ApiProperty({ example: 'Anotação criada/atualizada com sucesso.' })
    message: string;
}
