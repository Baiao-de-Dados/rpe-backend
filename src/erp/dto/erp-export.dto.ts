import { ApiProperty } from '@nestjs/swagger';

export class ProjetoDto {
    @ApiProperty({ example: 101, description: 'ID do projeto' })
    id: number;

    @ApiProperty({ example: 'Projeto A', description: 'Nome do projeto' })
    nome: string;

    @ApiProperty({ example: '3 meses', description: 'Tempo no projeto' })
    tempoNoProjeto: string;
}

export class UsuarioDto {
    @ApiProperty({ example: 1, description: 'ID do usuário' })
    id: number;

    @ApiProperty({ example: 'João Silva', description: 'Nome do usuário' })
    nome: string;

    @ApiProperty({ example: 'Backend', description: 'Trilha do usuário' })
    trilha: string;

    @ApiProperty({ example: 'Desenvolvedor Jr', description: 'Cargo do usuário' })
    cargo: string;

    @ApiProperty({ type: [ProjetoDto], description: 'Projetos do usuário' })
    projetos: ProjetoDto[];
}

export class ErpExportResponseDto {
    @ApiProperty({ type: [UsuarioDto], description: 'Lista de usuários' })
    usuarios: UsuarioDto[];
}
