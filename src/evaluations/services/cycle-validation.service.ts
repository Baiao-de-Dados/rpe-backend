import { Injectable, BadRequestException } from '@nestjs/common';
import { getBrazilDate } from 'src/cycles/utils';

@Injectable()
export class CycleValidationService {
    async validateActiveCycle(prisma: any, evaluationType: string): Promise<void> {
        const activeCycle = (await prisma.cycleConfig.findMany()).find(
            (cycle) =>
                !cycle.done &&
                new Date(getBrazilDate()) >= cycle.startDate &&
                new Date(getBrazilDate()) <= cycle.endDate,
        );

        if (!activeCycle) {
            throw new BadRequestException('Não há ciclo ativo configurado');
        }
        // Verificar se o ciclo não expirou
        const now = new Date(getBrazilDate());
        if (now > activeCycle.endDate) {
            throw new BadRequestException(
                `O ciclo ${activeCycle.name} expirou em ${activeCycle.endDate.toLocaleDateString()}. Não é possível criar avaliações do tipo ${evaluationType}.`,
            );
        }
        // Verificar se o ciclo já começou
        if (now < activeCycle.startDate) {
            throw new BadRequestException(
                `O ciclo ${activeCycle.name} ainda não começou. Início previsto para ${activeCycle.startDate.toLocaleDateString()}.`,
            );
        }
    }
}
