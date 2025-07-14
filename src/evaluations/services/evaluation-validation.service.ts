import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
        await this.validateAvaliacao360(avaliacao360);
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

    private async validateAvaliacao360(avaliacao360: Avaliacao360Dto[] | undefined): Promise<void> {
        if (!avaliacao360 || avaliacao360.length === 0) {
            return;
        }
        // Validar se os avaliados existem
        const avaliadoIds = avaliacao360
            .map((av) => av.avaliadoId)
            .filter((id) => id !== undefined && id !== null);

        if (avaliadoIds.length === 0) {
            return;
        }

        const avaliadosExistentes = await this.prisma.user.findMany({
            where: { id: { in: avaliadoIds } },
        });
        if (avaliadosExistentes.length !== avaliadoIds.length) {
            const idsExistentes = avaliadosExistentes.map((u) => u.id);
            const idsNaoExistentes = avaliadoIds.filter((id) => !idsExistentes.includes(id));
            throw new NotFoundException(
                `Avaliados não encontrados: ${idsNaoExistentes.join(', ')}`,
            );
        }
    }

    private async validateMentoring(
        mentoring: MentoringDto | undefined,
        colaboradorId: number,
    ): Promise<void> {
        if (!mentoring || !mentoring.mentorId) {
            return;
        }

        // Validar se o mentor existe
        const mentor = await this.prisma.user.findUnique({
            where: { id: mentoring.mentorId },
        });
        if (!mentor) {
            throw new NotFoundException(`Mentor com ID ${mentoring.mentorId} não encontrado`);
        }

        if (mentoring.mentorId === colaboradorId) {
            throw new BadRequestException('O colaborador não pode ser seu próprio mentor');
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
