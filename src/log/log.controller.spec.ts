import { Test, TestingModule } from '@nestjs/testing';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { Log } from '@prisma/client';

describe('LogController', () => {
    let controller: LogController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LogController],
            providers: [
                {
                    provide: LogService,
                    useValue: {
                        findAll: jest.fn().mockResolvedValue([
                            {
                                id: 1,
                                userId: 1,
                                action: 'ACCESS',
                                metadata: {},
                                createdAt: new Date(),
                            } as Log,
                        ]),
                    },
                },
            ],
        }).compile();
        controller = module.get<LogController>(LogController);
        // Removido: service = module.get<LogService>(LogService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return logs', async () => {
        const result = await controller.findAll();
        expect(result).toHaveLength(1);
        expect(result[0].action).toBe('ACCESS');
    });
});
