// import 'reflect-metadata'; Precisa ficar nessa linha
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    // Configurar o logger
    const logger = app.get(Logger);
    app.useLogger(logger);

    // Configurar CORS
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.useGlobalInterceptors(app.get(LoggingInterceptor));

    // Habilita transformação de DTOs em tempo de execução (Necessita por class-validator nos DTOs!)
    // Desabilitado devido ao tempo :/
    // app.useGlobalPipes(
    //     new ValidationPipe({
    //         whitelist: true,
    //         forbidNonWhitelisted: true,
    //         transform: true,
    //         transformOptions: {
    //             enableImplicitConversion: true,
    //         },
    //     }),
    // );

    // Configuração do Swagger
    const config = new DocumentBuilder()
        .setTitle('RPE API')
        .setDescription('API do sistema da RocketCorp')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'JWT-auth',
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');

    logger.log(`\nServer running on http://localhost:${port}`);
    logger.log(`\nSwagger documentation available at http://localhost:${port}/api`);
}

void bootstrap();
