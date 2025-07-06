import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ReferenceService {
    async createReferences(prisma: any, referencias: any[], colaboradorId: number) {
        if (!referencias || referencias.length === 0) {
            throw new BadRequestException('Referências são obrigatórias');
        }

        for (const referencia of referencias) {
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
                    comment: referencia.justificativa,
                },
            });
        }
    }
}
