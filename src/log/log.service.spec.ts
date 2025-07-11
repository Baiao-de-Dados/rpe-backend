import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from './log.service';
import { PrismaService } from '../prisma/prisma.service';
import { Log } from '@prisma/client';

describe('LogService', () => {
    let service: LogService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LogService,
                {
                    provide: PrismaService,
                    useValue: {
                        log: {
                            create: jest.fn().mockResolvedValue({} as Log),
                            findMany: jest.fn().mockResolvedValue([]),
                        },
                    },
                },
            ],
        }).compile();
        service = module.get<LogService>(LogService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a log', async function (this: void) {
        const data = { userId: 1, action: 'TEST', metadata: { foo: 'bar' } };
        await service.createLog(data as any);
        expect(prisma.log.create.mock.calls[0][0]).toEqual({ data });
    });

    it('should return all logs', async function (this: void) {
        await service.findAll();
        expect(prisma.log.findMany.mock.calls[0][0]).toEqual({ orderBy: { createdAt: 'desc' } });
    });
});
