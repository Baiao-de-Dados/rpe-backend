# Visão Geral

Este documento descreve como configurar e usar o interceptor de criptografia (`EncryptionInterceptor`) em diferentes módulos de uma aplicação NestJS, aproveitando o `CryptoModule` e o decorator `@EncryptField`.

# 1. Pré-requisitos

- Ter o módulo de criptografia implementado em `src/crypto/crypto.module.ts`.
- Conter o serviço `EncryptionService` em `src/crypto/encryption.service.ts`, exportado pelo `CryptoModule`.
- Variável de ambiente `ENCRYPTION_KEY` configurada (AES-256-CBC, 32 bytes).

# 2. Componentes Principais

## 2.1 CryptoModule

### Local: `src/crypto/crypto.module.ts`

```ts
@Module({
    providers: [EncryptionService],
    exports: [EncryptionService],
})
export class CryptoModule {}
```

## 2.2 EncryptionService

### Local: `src/crypto/encryption.service.ts`

- `encrypt(text: string): string` → retorna texto cifrado.

- `decrypt(data: string): string` → retorna texto original.

## 2.3 EncryptionInterceptor

### Local: `src/interceptors/encryption.interceptor.ts`

- ### Injeta EncryptionService.

- ### Antes da rota: criptografa campos marcados no body.

- ### Após a rota: descriptografa campos de resposta.

## 2.4 Decorator @EncryptField()

### Local: src/decorators/encrypt-field.decorator.ts

- ### Marca propriedades de DTO para criptografia.

- ### Usa Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, dtoConstructor).

# 3. Uso Local (por Controller/Módulo)

### Quando você quiser aplicar criptografia apenas em módulos ou controllers específicos:

### 3.1 Importar CryptoModule no Módulo

```// Exemplo: FooModule
import { Module } from '@nestjs/common';
import { FooController } from './foo.controller';
import { FooService }    from './foo.service';
import { CryptoModule }  from 'src/crypto/crypto.module';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';

@Module({
  imports: [CryptoModule],                        // 🔑
  providers: [
    FooService,
    EncryptionInterceptor,                        // 🔑
  ],
  controllers: [FooController],
})
export class FooModule {}
```

## 3.2 Aplicar Interceptor no Controller

```import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { CreateFooDto }       from './dto/create-foo.dto';

@UseInterceptors(EncryptionInterceptor)
@Controller('foo')
export class FooController {
  constructor(private readonly fooService: FooService) {}

  @Post()
  create(@Body() dto: CreateFooDto) {
    return this.fooService.create(dto);
  }
}
```

## 3.3 Marcar Campos para Criptografia

```import { EncryptField } from 'src/decorators/encrypt-field.decorator';

export class CreateFooDto {
  @EncryptField()
  sensitiveData: string;

  // outros campos...
}
```

# 4. Uso Global (todas as rotas)

### Se você quiser criptografar em toda a aplicação:

## 4.1 AppModule

```
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CryptoModule }       from 'src/crypto/crypto.module';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
// outros módulos...

@Module({
  imports: [
    CryptoModule,
    // ... outros módulos
  ],
  providers: [
    {
      provide:  APP_INTERCEPTOR,
      useClass: EncryptionInterceptor,
    },
  ],
})
export class AppModule {}
```

## 4.2 Remover configurações locais

- ### Não é necessário @UseInterceptors nos controllers.

- ### Nem registrar o interceptor como provider em módulos específicos.

# 5. Validação e Transformação de DTOs

### Recomenda-se usar ValidationPipe global:

```
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
}));
```

### Isso garante que apenas campos definidos no DTO sejam aceitos e transformados em instâncias corretas.

# 6. Resumo de Passos

### 1. Configure CryptoModule com EncryptionService exportado.

### 2. Importe CryptoModule nos módulos onde for usar.

### 3. Declare EncryptionInterceptor em providers desses módulos.

### 4. Anote controllers com @UseInterceptors(EncryptionInterceptor).

### 5. Marque campos sensíveis nos DTOs com @EncryptField().

### 6. Para uso global, registre o interceptor no AppModule via APP_INTERCEPTOR.
