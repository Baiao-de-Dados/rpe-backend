import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Configurar CORS
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    // Configurar guards globais
    const jwtAuthGuard = app.get(JwtAuthGuard);

    // Aplicar apenas o JwtAuthGuard globalmente, o RolesGuard será aplicado onde necessário
    app.useGlobalGuards(jwtAuthGuard);

    // Configuração do Swagger
    const config = new DocumentBuilder()
        .setTitle('RPE API')
        .setDescription('API do sistema da RockeCorp')
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
            'JWT-auth', // This name here is important for references
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 Swagger documentation available at http://localhost:${port}/api`);
}
void bootstrap();
