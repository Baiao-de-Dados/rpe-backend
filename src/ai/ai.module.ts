import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { NotesModule } from '../notes/notes.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [NotesModule, PrismaModule],
    providers: [AiService],
    controllers: [AiController],
    exports: [AiService],
})
export class AiModule {}
