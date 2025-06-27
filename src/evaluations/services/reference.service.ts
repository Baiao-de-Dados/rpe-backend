import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ReferenceService {
    async createReferences(prisma: any, referencias: any[], colaboradorId: number) {
        if (!referencias || referencias.length === 0) {
            throw new BadRequestException('Referências são obrigatórias');
        }

        for (const referencia of referencias) {
            if (!referencia.tagIds) {
                throw new BadRequestException('Tags são obrigatórias na referência');
            }
            if (!Array.isArray(referencia.tagIds) || referencia.tagIds.length === 0) {
                throw new BadRequestException('Tags não podem estar vazias');
            }
            if (!referencia.justificativa) {
                throw new BadRequestException('Justificativa é obrigatória na referência');
            }
            if (!referencia.colaboradorId) {
                throw new BadRequestException('ID do colaborador de referência é obrigatório');
            }

            await prisma.reference.create({
                data: {
                    fromId: colaboradorId,
                    toId: parseInt(referencia.colaboradorId, 10),
                    tags: referencia.tagIds.map((id: number) => id.toString()),
                    comment: referencia.justificativa,
                },
            });
        }
    }
}
