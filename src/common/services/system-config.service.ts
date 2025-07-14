import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getBrazilDate } from 'src/cycles/utils';

@Injectable()
export class SystemConfigService {
    constructor(private prisma: PrismaService) {}

    getCurrentCycle(): string {
        const currentDate = new Date(getBrazilDate());
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const semester = month <= 6 ? `1` : `2`;
        return `${year}.${semester}`;
    }

    async getAllCycles(): Promise<string[]> {
        const evaluations = await this.prisma.evaluation.findMany({
            select: { cycleConfig: { select: { name: true } } },
            distinct: ['cycleConfigId'],
            orderBy: { createdAt: 'desc' },
        });
        return evaluations.map((evaluation) => evaluation.cycleConfig.name);
    }
}
