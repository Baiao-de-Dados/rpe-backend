import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { PillarsModule } from './pillars/pillars.module';
import { CriteriaModule } from './criteria/criteria.module';
import { TagsModule } from './tags/tags.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        UserModule,
        AuthModule,
        EvaluationsModule,
        PillarsModule,
        CriteriaModule,
        TagsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
