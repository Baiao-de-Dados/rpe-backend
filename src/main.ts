import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Configuração do Swagger
    const config = new DocumentBuilder()
        .setTitle('RPE API')
        .setDescription('API do sistema da RockeCorp')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 Swagger documentation available at http://localhost:${port}/api`);
}
void bootstrap();
