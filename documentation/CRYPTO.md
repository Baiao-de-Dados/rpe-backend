# Guia de Criptografia de Campos Sensíveis

Este documento explica como aplicar criptografia de campos sensíveis em entidades e módulos do projeto usando o `EncryptionService` de forma **manual** e padronizada.

---

## 1. Pré-requisitos

- O módulo de criptografia (`CryptoModule`) deve estar implementado e exportando o `EncryptionService`.
- A variável de ambiente `ENCRYPTION_KEY` deve estar configurada (32 bytes para AES-256-CBC).

---

## 2. Como Usar em Novas Entidades/Módulos

### 2.1. Importe o CryptoModule

No módulo onde deseja usar a criptografia, importe o `CryptoModule`:

```typescript
import { Module } from '@nestjs/common';
import { CryptoModule } from 'src/crypto/crypto.module';

@Module({
    imports: [CryptoModule],
    // ... outros providers/controllers
})
export class MinhaEntidadeModule {}
```

---

### 2.2. Injete o EncryptionService no Serviço

No serviço responsável pela entidade, injete o `EncryptionService`:

```typescript
import { Injectable } from '@nestjs/common';
import { EncryptionService } from 'src/crypto/encryption.service';

@Injectable()
export class MinhaEntidadeService {
    constructor(private encryptionService: EncryptionService) {}

    // ...
}
```

---

### 2.3. Criptografe Antes de Salvar

Antes de salvar dados sensíveis no banco, **sempre criptografe** usando o método `encrypt`:

```typescript
async create(dto: CreateMinhaEntidadeDto) {
  const encrypted = this.encryptionService.encrypt(dto.dadoSensivel);
  // Salve no banco o valor criptografado
  await this.repo.create({
    data: {
      ...dto,
      dadoSensivel: encrypted,
    },
  });
}
```

---

### 2.4. Descriptografe Antes de Retornar

Antes de retornar dados sensíveis para o cliente, **sempre descriptografe** usando o método `decrypt`:

```typescript
async findOne(id: number) {
  const entity = await this.repo.findUnique({ where: { id } });
  entity.dadoSensivel = this.encryptionService.decrypt(entity.dadoSensivel);
  return entity;
}
```

---

## 3. Boas Práticas

- **Nunca** salve dados sensíveis em texto puro no banco.
- Sempre criptografe manualmente no serviço antes de salvar.
- Sempre descriptografe manualmente no serviço antes de retornar ao cliente.
- Não dependa de interceptors ou decorators para criptografia de dados sensíveis.

---

## 4. Exemplo Completo

```typescript
// DTO
export class CreateFooDto {
    sensitiveData: string;
    // ...
}

// Serviço
@Injectable()
export class FooService {
    constructor(private encryptionService: EncryptionService) {}

    async create(dto: CreateFooDto) {
        const encrypted = this.encryptionService.encrypt(dto.sensitiveData);
        // Salve no banco
        await this.repo.create({
            data: {
                ...dto,
                sensitiveData: encrypted,
            },
        });
    }

    async findOne(id: number) {
        const entity = await this.repo.findUnique({ where: { id } });
        entity.sensitiveData = this.encryptionService.decrypt(entity.sensitiveData);
        return entity;
    }
}
```

---

Dúvidas? Consulte o código do `EncryptionService` ou peça ajuda ao time!
