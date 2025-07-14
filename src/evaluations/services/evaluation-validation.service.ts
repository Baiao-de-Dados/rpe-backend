import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto';
import {
    AutoAvaliacaoDto,
    Avaliacao360Dto,
    MentoringDto,
    ReferenciaDto,
} from '../interfaces/evaluation.interface';

@Injectable()
export class EvaluationValidationService {
    constructor(private prisma: PrismaService) {}

    async validateEvaluationData(data: CreateEvaluationDto): Promise<void> {
        const { colaboradorId, autoavaliacao, avaliacao360, mentoring, referencias } = data;
        const colaboradorIdNum = colaboradorId;

        await this.validateColaborador(colaboradorIdNum);
        await this.validateCriterios(autoavaliacao);
        await this.validateAvaliacao360(avaliacao360, colaboradorIdNum);
        await this.validateMentoring(mentoring, colaboradorIdNum);
        await this.validateReferencias(referencias);
        this.validateDuplicates(avaliacao360, referencias);
    }

    private async validateColaborador(colaboradorId: number): Promise<void> {
        const colaborador = await this.prisma.user.findUnique({
            where: { id: colaboradorId },
        });
        if (!colaborador) {
            throw new NotFoundException(`Colaborador com ID ${colaboradorId} não encontrado`);
        }
    }

    private async validateCriterios(autoavaliacao: AutoAvaliacaoDto | undefined): Promise<void> {
        if (!autoavaliacao || !autoavaliacao.pilares || autoavaliacao.pilares.length === 0) {
            return;
        }

        const criterioIds = autoavaliacao.pilares
            .flatMap((pilar) => pilar.criterios.map((criterio) => criterio.criterioId))
            .filter((id) => id !== undefined && id !== null);

        if (criterioIds.length === 0) {
            return;
        }

        const criteriosExistentes = await this.prisma.criterion.findMany({
            where: { id: { in: criterioIds } },
        });
        if (criteriosExistentes.length !== criterioIds.length) {
            const idsExistentes = criteriosExistentes.map((c) => c.id);
            const idsNaoExistentes = criterioIds.filter((id) => !idsExistentes.includes(id));
            throw new NotFoundException(
                `Critérios não encontrados: ${idsNaoExistentes.join(', ')}`,
            );
        }
    }

    async validateAvaliacao360(avaliacao360: Avaliacao360Dto[], colaboradorId: number) {
        if (!avaliacao360 || avaliacao360.length === 0) return;
        // Buscar todos os projetos do colaborador
        const projetosColaborador = await this.prisma.projectMember.findMany({
            where: { userId: colaboradorId },
            select: { projectId: true },
        });
        const projetosIds = projetosColaborador.map((p) => p.projectId);
        for (const avaliacao of avaliacao360) {
            // Buscar se o avaliado está em algum projeto em comum
            const membroComum = await this.prisma.projectMember.findFirst({
                where: {
                    userId: avaliacao.avaliadoId,
                    projectId: { in: projetosIds },
                },
            });
            if (!membroComum) {
                throw new ForbiddenException(
                    'Só é possível avaliar pessoas que estão no mesmo projeto que você (360).',
                );
            }
        }
    }

    async validateMentoring(mentoring: MentoringDto, colaboradorId: number) {
        if (!mentoring || !mentoring.mentorId) return;
        // Buscar o usuário do colaborador
        const colaborador = await this.prisma.user.findUnique({ where: { id: colaboradorId } });
        if (!colaborador) throw new ForbiddenException('Colaborador não encontrado');
        if (colaborador.mentorId !== mentoring.mentorId) {
            throw new ForbiddenException(
                'Só é possível avaliar como mentor quem realmente é seu mentor.',
            );
        }
    }

    private async validateReferencias(referencias: ReferenciaDto[] | undefined): Promise<void> {
        if (!referencias || referencias.length === 0) {
            return;
        }
        // Validar se os colaboradores de referência existem
        const referenciaColaboradorIds = referencias
            .map((r) => r.colaboradorId)
            .filter((id) => id !== undefined && id !== null);

        if (referenciaColaboradorIds.length === 0) {
            return;
        }

        const referenciaColaboradoresExistentes = await this.prisma.user.findMany({
            where: { id: { in: referenciaColaboradorIds } },
        });
        if (referenciaColaboradoresExistentes.length !== referenciaColaboradorIds.length) {
            const idsExistentes = referenciaColaboradoresExistentes.map((u) => u.id);
            const idsNaoExistentes = referenciaColaboradorIds.filter(
                (id) => !idsExistentes.includes(id),
            );
            throw new NotFoundException(
                `Colaboradores de referência não encontrados: ${idsNaoExistentes.join(', ')}`,
            );
        }
    }

    private validateDuplicates(
        avaliacao360: Avaliacao360Dto[] | undefined,
        referencias: ReferenciaDto[] | undefined,
    ): void {
        if (avaliacao360 && avaliacao360.length > 0) {
            const avaliadoIds = avaliacao360
                .map((av) => av.avaliadoId)
                .filter((id) => id !== undefined && id !== null);
            const avaliadoIdsUnicos = new Set(avaliadoIds);
            if (avaliadoIdsUnicos.size !== avaliadoIds.length) {
                throw new BadRequestException(
                    'Não é possível avaliar o mesmo colaborador múltiplas vezes na avaliação360',
                );
            }
        }

        if (referencias && referencias.length > 0) {
            const referenciaColaboradorIds = referencias
                .map((r) => r.colaboradorId)
                .filter((id) => id !== undefined && id !== null);
            const referenciaColaboradorIdsUnicos = new Set(referenciaColaboradorIds);
            if (referenciaColaboradorIdsUnicos.size !== referenciaColaboradorIds.length) {
                throw new BadRequestException(
                    'Não é possível referenciar o mesmo colaborador múltiplas vezes',
                );
            }
        }
    }
}
