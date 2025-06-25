import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditMiddleware } from './common/middleware/audit.middleware';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { CriteriaModule } from './criteria/criteria.module';
import { PillarsModule } from './pillars/pillars.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TagsModule } from './tags/tags.module';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { LoggerModule } from 'nestjs-pino';
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
        PillarsModule,
        CriteriaModule,
        TagsModule,
        CommonModule,
    ],
    controllers: [AppController],
    providers: [AppService, LoggingInterceptor],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuditMiddleware)
            .forRoutes('evaluations', 'pillars', 'criteria', 'tags', 'users');
    }
}
