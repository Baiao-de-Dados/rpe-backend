import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
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

    /**
     * Valida todos os dados antes de criar a avaliação
     */
    async validateEvaluationData(data: CreateEvaluationDto): Promise<void> {
        const { ciclo, colaboradorId, autoavaliacao, avaliacao360, mentoring, referencias } = data;

        await Promise.all([
            this.validateColaborador(colaboradorId),
            this.validateExistingEvaluation(colaboradorId, ciclo),
            this.validateCriterios(autoavaliacao),
            this.validateAvaliacao360(avaliacao360, colaboradorId),
            this.validateMentoring(mentoring, colaboradorId),
            this.validateReferencias(referencias, colaboradorId),
            this.validateTags(referencias),
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

    private async validateExistingEvaluation(colaboradorId: number, ciclo: string): Promise<void> {
        const existingEvaluation = await this.prisma.evaluation.findFirst({
            where: {
                userId: colaboradorId,
                cycle: ciclo,
            },
        });
        if (existingEvaluation) {
            throw new ConflictException(
                `Já existe uma avaliação para o colaborador ${colaboradorId} no ciclo ${ciclo}`,
            );
        }
    }

    private async validateCriterios(autoavaliacao: AutoAvaliacaoDto): Promise<void> {
        const criterioIds = autoavaliacao.pilares.flatMap((pilar) =>
            pilar.criterios.map((criterio) => criterio.criterioId),
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
        const avaliadoIds = avaliacao360.map((av) => av.avaliadoId);
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
        const mentorIds = mentoring.map((m) => m.mentorId);
        const mentoresExistentes = await this.prisma.user.findMany({
            where: { id: { in: mentorIds } },
        });
        if (mentoresExistentes.length !== mentorIds.length) {
            const idsExistentes = mentoresExistentes.map((u) => u.id);
            const idsNaoExistentes = mentorIds.filter((id) => !idsExistentes.includes(id));
            throw new NotFoundException(`Mentores não encontrados: ${idsNaoExistentes.join(', ')}`);
        }

        // Verificar se o colaborador não está se auto-mentorando
        if (mentorIds.includes(colaboradorId)) {
            throw new BadRequestException('O colaborador não pode ser seu próprio mentor');
        }
    }

    private async validateReferencias(
        referencias: ReferenciaDto[],
        colaboradorId: number,
    ): Promise<void> {
        const referenciaColaboradorIds = referencias.map((r) => r.colaboradorId);
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

    private async validateTags(referencias: ReferenciaDto[]): Promise<void> {
        const tagIds = referencias.flatMap((r) => r.tagIds);
        const tagsExistentes = await this.prisma.tag.findMany({
            where: { id: { in: tagIds } },
        });
        if (tagsExistentes.length !== tagIds.length) {
            const idsExistentes = tagsExistentes.map((t) => t.id);
            const idsNaoExistentes = tagIds.filter((id) => !idsExistentes.includes(id));
            throw new NotFoundException(`Tags não encontradas: ${idsNaoExistentes.join(', ')}`);
        }
    }

    private validateDuplicates(
        avaliacao360: Avaliacao360Dto[],
        mentoring: MentoringDto[],
        referencias: ReferenciaDto[],
    ): void {
        // Verificar duplicatas na avaliação360
        const avaliadoIds = avaliacao360.map((av) => av.avaliadoId);
        const avaliadoIdsUnicos = new Set(avaliadoIds);
        if (avaliadoIdsUnicos.size !== avaliadoIds.length) {
            throw new BadRequestException(
                'Não é possível avaliar o mesmo colaborador múltiplas vezes na avaliação360',
            );
        }

        // Verificar duplicatas no mentoring
        const mentorIds = mentoring.map((m) => m.mentorId);
        const mentorIdsUnicos = new Set(mentorIds);
        if (mentorIdsUnicos.size !== mentorIds.length) {
            throw new BadRequestException('Não é possível ter o mesmo mentor múltiplas vezes');
        }

        // Verificar duplicatas nas referências
        const referenciaColaboradorIds = referencias.map((r) => r.colaboradorId);
        const referenciaColaboradorIdsUnicos = new Set(referenciaColaboradorIds);
        if (referenciaColaboradorIdsUnicos.size !== referenciaColaboradorIds.length) {
            throw new BadRequestException(
                'Não é possível referenciar o mesmo colaborador múltiplas vezes',
            );
        }
    }
}
