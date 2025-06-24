import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Logger para mensagens de inicialização
    const logger = new Logger('Bootstrap');

    // Configurar guard global
    const jwtAuthGuard = app.get(JwtAuthGuard);
    app.useGlobalGuards(jwtAuthGuard);

    // Configurar CORS
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

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

    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📚 Swagger documentation available at http://localhost:${port}/api`);
}

void bootstrap();
