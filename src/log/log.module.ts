import { Global, Module } from '@nestjs/common';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [LogService],
    controllers: [LogController],
    exports: [LogService],
})
export class LogModule {}
