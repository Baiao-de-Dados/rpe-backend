import { Injectable } from '@nestjs/common';

@Injectable()
export class ReferenceService {
    async createReferences(prisma: any, referencias: any[], colaboradorId: number) {
        if (referencias && referencias.length > 0) {
            for (const referencia of referencias) {
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
}
