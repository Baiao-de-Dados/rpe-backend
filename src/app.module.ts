import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditMiddleware } from './common/middleware/audit.middleware';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ErpModule } from './common/erp/erp.module';
import { CycleConfigModule } from './cycles/cycle-config.module';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TrackModule } from './track/track.module';
import { ImportEvaluationsModule } from './import-export/import-evaluations/import-evaluations.module';
import { LogModule } from './log/log.module';
import { NotesModule } from './notes/notes.module';
import { AiModule } from './ai/ai.module';
import { ExportEvaluationsModule } from './import-export/export-evaluations/export-evaluations.module';
import { CollaboratorsModule } from './evaluations/collaborators/collaborators.module';
import { EqualizationModule } from './evaluations/equalization/equalization.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        LoggerModule.forRoot({
            pinoHttp: {
                level: process.env.LOG_LEVEL || 'info',
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname,req.headers,req.cookies,res.headers',
                    },
                },
            },
        }),
        PrismaModule,
        UserModule,
        AuthModule,
        EvaluationsModule,
        ErpModule,
        CycleConfigModule,
        CommonModule,
        TrackModule,
        ImportEvaluationsModule,
        LogModule,
        NotesModule,
        AiModule,
        ExportEvaluationsModule,
        CollaboratorsModule,
        EqualizationModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        LoggingInterceptor,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuditMiddleware)
            .forRoutes('evaluations', 'pillars', 'criteria', 'users', 'export', 'cycle-config');
    }
}
