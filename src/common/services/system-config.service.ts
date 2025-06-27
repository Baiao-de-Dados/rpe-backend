import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemConfigService {
    constructor(private prisma: PrismaService) {}

    getCurrentCycle(): string {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const semester = month <= 6 ? `1` : `2`;
        return `${year}.${semester}`;
    }

    async getAllCycles(): Promise<string[]> {
        const evaluations = await this.prisma.evaluation.findMany({
            select: { cycle: true },
            distinct: ['cycle'],
            orderBy: { cycle: 'desc' },
        });
        return evaluations.map((evaluation) => evaluation.cycle.toString());
    }
}
