import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Log, Prisma } from '@prisma/client';

interface FindAllParams {
    page?: number;
    pageSize?: number;
    action?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    order?: 'asc' | 'desc';
}

@Injectable()
export class LogService {
    constructor(private readonly prisma: PrismaService) {}

    async createLog(data: Prisma.LogCreateInput): Promise<Log> {
        return this.prisma.log.create({ data });
    }

    async findAll(params: FindAllParams) {
        const page = Number(params.page) || 1;
        const pageSize = Number(params.pageSize) || 50;
        const skip = (page - 1) * pageSize;
        const { action, search, dateFrom, order = 'desc' } = params;

        const where: Prisma.LogWhereInput = {};

        if (action) {
            where.action = action;
        }

        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { metadata: { path: ['ip'], string_contains: search, mode: 'insensitive' } },
                { metadata: { path: ['url'], string_contains: search, mode: 'insensitive' } },
                { metadata: { path: ['method'], string_contains: search, mode: 'insensitive' } },
                { metadata: { path: ['userAgent'], string_contains: search, mode: 'insensitive' } },
                {
                    metadata: {
                        path: ['statusCode'],
                        string_contains: search,
                        mode: 'insensitive',
                    },
                },
                { metadata: { path: ['error'], string_contains: search, mode: 'insensitive' } },
                // adicione outras chaves que quiser pesquisar
            ];
        }

        if (dateFrom) {
            const from = new Date(dateFrom);
            const to = new Date(from);
            to.setSeconds(59);
            to.setMilliseconds(999);

            where.createdAt = {
                gte: from,
                lte: to,
            };
        }

        const [logs, total] = await this.prisma.$transaction([
            this.prisma.log.findMany({
                skip,
                take: pageSize,
                where,
                orderBy: { createdAt: order },
            }),
            this.prisma.log.count({ where }),
        ]);

        return {
            logs,
            currentPage: page,
            hasNext: skip + pageSize < total,
        };
    }
}
