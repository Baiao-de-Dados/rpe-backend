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
        const colaboradorIdNum = parseInt(colaboradorId, 10);

        await Promise.all([
            this.validateColaborador(colaboradorIdNum),
            this.validateCriterios(autoavaliacao),
            this.validateAvaliacao360(avaliacao360, colaboradorIdNum),
            this.validateMentoring(Array.isArray(mentoring) ? mentoring : [], colaboradorIdNum),
            this.validateReferencias(referencias, colaboradorIdNum),
            this.validateDuplicates(avaliacao360, mentoring, referencias),
        ]);

        console.log('Todas as validações passaram com sucesso');
    }

    private async validateColaborador(colaboradorId: number): Promise<void> {
        const colaborador = await this.prisma.user.findUnique({
            where: { id: colaboradorId },
        });
        if (!colaborador) {
            throw new NotFoundException(`Colaborador com ID ${colaboradorId} não encontrado`);
        }
    }

    private async validateCriterios(autoavaliacao: AutoAvaliacaoDto): Promise<void> {
        if (!autoavaliacao || !autoavaliacao.pilares || autoavaliacao.pilares.length === 0) {
            return;
        }

        const criterioIds = autoavaliacao.pilares.flatMap((pilar) =>
            pilar.criterios.map((criterio) => parseInt(criterio.criterioId, 10)),
        );
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

    private async validateAvaliacao360(
        avaliacao360: Avaliacao360Dto[],
        colaboradorId: number,
    ): Promise<void> {
        if (!avaliacao360 || avaliacao360.length === 0) {
            return;
        }

        const avaliadoIds = avaliacao360.map((av) => parseInt(av.avaliadoId, 10));
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

        // Verificar se o colaborador não está se auto-avaliando
        if (avaliadoIds.includes(colaboradorId)) {
            throw new BadRequestException('O colaborador não pode se auto-avaliar na avaliação360');
        }
    }

    private async validateMentoring(
        mentoring: MentoringDto[],
        colaboradorId: number,
    ): Promise<void> {
        if (!mentoring || mentoring.length === 0) {
            return;
        }

        for (const m of mentoring) {
            if (m.mentorId) {
                const mentor = await this.prisma.user.findUnique({
                    where: { id: parseInt(m.mentorId, 10) },
                });
                if (!mentor) {
                    throw new NotFoundException(`Mentor com ID ${m.mentorId} não encontrado`);
                }
                if (parseInt(m.mentorId, 10) === colaboradorId) {
                    throw new BadRequestException('O colaborador não pode ser seu próprio mentor');
                }
            }
            if (m.leaderId) {
                const leader = await this.prisma.user.findUnique({
                    where: { id: parseInt(m.leaderId, 10) },
                });
                if (!leader) {
                    throw new NotFoundException(`Líder com ID ${m.leaderId} não encontrado`);
                }
                if (parseInt(m.leaderId, 10) === colaboradorId) {
                    throw new BadRequestException('O colaborador não pode ser seu próprio líder');
                }
            }
        }
    }

    private async validateReferencias(
        referencias: ReferenciaDto[],
        colaboradorId: number,
    ): Promise<void> {
        if (!referencias || referencias.length === 0) {
            return;
        }

        const referenciaColaboradorIds = referencias.map((r) => parseInt(r.colaboradorId, 10));
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

        // Verificar se o colaborador não está se auto-referenciando
        if (referenciaColaboradorIds.includes(colaboradorId)) {
            throw new BadRequestException('O colaborador não pode se auto-referenciar');
        }
    }

    private validateDuplicates(
        avaliacao360: Avaliacao360Dto[],
        mentoring: MentoringDto[] | null | undefined,
        referencias: ReferenciaDto[],
    ): void {
        if (avaliacao360 && avaliacao360.length > 0) {
            const avaliadoIds = avaliacao360.map((av) => av.avaliadoId);
            const avaliadoIdsUnicos = new Set(avaliadoIds);
            if (avaliadoIdsUnicos.size !== avaliadoIds.length) {
                throw new BadRequestException(
                    'Não é possível avaliar o mesmo colaborador múltiplas vezes na avaliação360',
                );
            }
        }

        if (referencias && referencias.length > 0) {
            const referenciaColaboradorIds = referencias.map((r) => r.colaboradorId);
            const referenciaColaboradorIdsUnicos = new Set(referenciaColaboradorIds);
            if (referenciaColaboradorIdsUnicos.size !== referenciaColaboradorIds.length) {
                throw new BadRequestException(
                    'Não é possível referenciar o mesmo colaborador múltiplas vezes',
                );
            }
        }
    }
}
