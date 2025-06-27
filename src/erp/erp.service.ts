import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErpExportResponseDto, UsuarioDto, ProjetoDto } from './dto/erp-export.dto';

@Injectable()
export class ErpService {
    constructor(private prisma: PrismaService) {}

    async exportErpData(): Promise<ErpExportResponseDto> {
        // Buscar todos os usuários com seus projetos
        const users = await this.prisma.user.findMany({
            include: {
                projectMember: {
                    include: {
                        project: true,
                    },
                },
                userRoles: {
                    where: {
                        isActive: true,
                    },
                },
            },
        });

        const usuarios: UsuarioDto[] = users.map((user) => {
            // Mapear projetos do usuário
            const projetos: ProjetoDto[] = user.projectMember.map((member) => {
                const startDate = member.startDate;
                const endDate = member.endDate || new Date();
                const tempoNoProjeto = this.calcularTempoNoProjeto(startDate, endDate);

                return {
                    id: member.project.id,
                    nome: member.project.name,
                    tempoNoProjeto,
                };
            });

            // Determinar cargo baseado nos roles ativos
            const cargo = this.determinarCargo(user.userRoles);

            return {
                id: user.id,
                nome: user.name || 'Nome não informado',
                trilha: user.track || 'Trilha não informada',
                cargo,
                projetos,
            };
        });

        return { usuarios };
    }

    private calcularTempoNoProjeto(startDate: Date, endDate: Date): string {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} dias`;
        } else if (diffDays < 365) {
            const meses = Math.floor(diffDays / 30);
            return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
        } else {
            const anos = Math.floor(diffDays / 365);
            const mesesRestantes = Math.floor((diffDays % 365) / 30);
            if (mesesRestantes === 0) {
                return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
            }
            return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`;
        }
    }

    private determinarCargo(userRoles: any[]): string {
        if (userRoles.length === 0) {
            return 'Sem cargo definido';
        }

        // Mapear roles para cargos
        const roleToCargo: { [key: string]: string } = {
            DEVELOPER: 'Desenvolvedor Jr',
            LEADER: 'Tech Lead',
            MANAGER: 'Gerente',
            ANALYST: 'Analista',
            TESTER: 'QA',
            DESIGNER: 'Designer',
            ARCHITECT: 'Arquiteto',
            BUSINESSMAN: 'Analista de Negócios',
            RH: 'Recursos Humanos',
            ADMIN: 'Administrador',
        };

        // Pegar o primeiro role ativo
        const primaryRole = userRoles[0]?.role;
        return roleToCargo[primaryRole] || 'Cargo não definido';
    }
}
