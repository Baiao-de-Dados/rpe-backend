import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemConfigService {
    constructor(private prisma: PrismaService) {}

    async getCurrentCycle(): Promise<string> {
        const config = await this.prisma.systemConfig.findUnique({
            where: { key: 'current_cycle' },
        });
        return config?.value || 'N/A';
    }

    async setCurrentCycle(cycle: string): Promise<void> {
        await this.prisma.systemConfig.upsert({
            where: { key: 'current_cycle' },
            update: { value: cycle },
            create: {
                key: 'current_cycle',
                value: cycle,
                description: 'Ciclo atual de avaliações',
            },
        });
    }

    async getAllCycles(): Promise<string[]> {
        const evaluations = await this.prisma.evaluation.findMany({
            select: { cycle: true },
            distinct: ['cycle'],
            orderBy: { cycle: 'desc' },
        });
        return evaluations.map((e) => e.cycle);
    }

    async getConfig(key: string): Promise<string | null> {
        const config = await this.prisma.systemConfig.findUnique({
            where: { key },
        });
        return config?.value || null;
    }

    async setConfig(key: string, value: string, description?: string): Promise<void> {
        await this.prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: {
                key,
                value,
                description,
            },
        });
    }
}
