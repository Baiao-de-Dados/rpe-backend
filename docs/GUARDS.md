# Guia de Guards e Autorização

Este guia explica como usar o sistema de autenticação e autorização em nossa aplicação NestJS + Prisma.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Roles Disponíveis](#roles-disponíveis)
- [Decorators Disponíveis](#decorators-disponíveis)
- [Exemplos Práticos](#exemplos-práticos)
- [Testes com curl](#testes-com-curl)
- [Boas Práti### 4. **Use @ExactRoles apenas quando necessário**

```typescript
// ✅ Casos válidos para @ExactRoles:
// - Ferramentas específicas de uma role
// - Fluxos que não devem ser acessados por superiores
@ExactRoles(UserRoleEnum.DEVELOPER) // Só desenvolvedores
@ExactRoles(UserRoleEnum.RH, UserRoleEnum.MANAGER) // Múltiplas roles específicas
```

### 5. **Docummente permissões complexas**-práticas)

## 🔍 Visão Geral

Nossa aplicação utiliza **múltiplas roles por usuário** com sistema hierárquico:

- **JWT**: Autenticação via token JWT
- **Múltiplas Roles**: Um usuário pode ter várias roles simultaneamente
- **Hierarquia**: Roles superiores incluem permissões das inferiores
- **Guards Globais**: Guards aplicados automaticamente em todas as rotas (configurados no `app.module.ts`)
- **Guards Flexíveis**: Suporte a verificação hierárquica e exata

### ⚡ Guards Globais Configurados

Os guards estão configurados **globalmente** no `src/app.module.ts`:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,    // ← Autenticação global
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,      // ← Autorização global
  },
],
```

**Resultado**: Todas as rotas são automaticamente protegidas - você só precisa usar os decorators!

## 👥 Roles Disponíveis

```typescript
enum UserRoleEnum {
  ADMIN       // Acesso total
  RH          // Recursos Humanos + roles inferiores
  MANAGER     // Gerenciamento + roles inferiores
  DEVELOPER   // Desenvolvimento + roles inferiores
  SUPPORT     // Suporte + roles inferiores
  USER        // Acesso básico
}
```

### Hierarquia de Roles

```
ADMIN (nível 6)
  ↓ inclui todas as permissões abaixo
RH (nível 5)
  ↓ inclui todas as permissões abaixo
MANAGER (nível 4)
  ↓ inclui todas as permissões abaixo
DEVELOPER (nível 3)
  ↓ inclui todas as permissões abaixo
SUPPORT (nível 2)
  ↓ inclui todas as permissões abaixo
USER (nível 1)
```

## 🛡️ Decorators Disponíveis

### 1. `@Public()`

Torna a rota pública (sem autenticação necessária)

```typescript
@Get('health')
@Public()
getHealth() {
  return { status: 'ok' };
}
```

### 2. `@Roles(...roles)`

Verificação hierárquica - aceita a role especificada OU superiores

```typescript
@Get('dashboard')
@Roles(UserRoleEnum.MANAGER)
getDashboard() {
  // Acesso: MANAGER, DEVELOPER, ADMIN
}
```

### 3. `@ExactRoles(...roles)`

Verificação exata - aceita APENAS as roles especificadas

```typescript
@Get('developer-tools')
@ExactRoles(UserRoleEnum.DEVELOPER)
getDeveloperTools() {
  // Acesso: APENAS DEVELOPER
}
```

### 4. `@RequireAdmin()`

Atalho para verificação hierárquica de ADMIN

```typescript
@Delete('system-reset')
@RequireAdmin()
resetSystem() {
  // Acesso: APENAS ADMIN
}
```

### 5. `@RequireRH()`

Atalho para verificação hierárquica de RH

```typescript
@Get('employees')
@RequireRH()
getEmployees() {
  // Acesso: RH, ADMIN
}
```

### 6. `@RequireManager()`

Atalho para verificação hierárquica de MANAGER

```typescript
@Post('projects')
@RequireManager()
createProject() {
  // Acesso: MANAGER, RH, ADMIN
}
```

### 7. `@OnlyAdmin()`

Atalho para verificação exata de ADMIN

```typescript
@Get('system-logs')
@OnlyAdmin()
getSystemLogs() {
  // Acesso: APENAS ADMIN
}
```

### 8. `@CurrentUser()`

Obtém dados do usuário autenticado

```typescript
@Get('profile')
getProfile(@CurrentUser() user: any) {
  return user; // { id, email, roles: [...] }
}
```

## 💡 Exemplos Práticos

### Controller Real (Baseado no UserController)

```typescript
@Controller('users')
export class UserController {
    // ✅ Público - sem autenticação
    @Get('health')
    @Public()
    getHealth() {
        return { status: 'ok' };
    }

    // ✅ Qualquer usuário autenticado
    @Get('profile')
    getOwnProfile(@CurrentUser() user: UserFromJwt) {
        return { id: user.id, email: user.email };
    }

    // ✅ RH ou superior (ADMIN)
    @Get()
    @RequireRH()
    findAll() {
        return this.userService.findAll();
    }

    // ✅ RH ou ADMIN (verificação hierárquica)
    @Get(':id')
    @Roles(UserRoleEnum.RH, UserRoleEnum.ADMIN)
    findOne(@Param('id') id: string) {
        return this.userService.findOne(+id);
    }

    // ✅ MANAGER ou superior (RH, ADMIN)
    @Patch(':id')
    @RequireManager()
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.userService.updateUser(+id, updateDto);
    }

    // ✅ APENAS ADMIN (verificação exata)
    @Delete(':id')
    @OnlyAdmin()
    remove(@Param('id') id: string) {
        return this.userService.deleteUser(+id);
    }

    // ✅ ADMIN hierárquico - gerenciar roles
    @Post(':id/roles')
    @RequireAdmin()
    assignRole(@Param('id') userId: string, @Body() body: any) {
        return this.userService.assignRole(+userId, body.role);
    }

    // ✅ ADMIN hierárquico - remover roles
    @Delete(':id/roles/:role')
    @RequireAdmin()
    removeRole(@Param('id') userId: string, @Param('role') role: UserRoleEnum) {
        return this.userService.removeRole(+userId, role);
    }
}
```

### 🔑 **Pontos Importantes:**

1. **Sem `@UseGuards()`** - Guards são aplicados globalmente
2. **Por padrão, rotas são protegidas** - Use `@Public()` para tornar públicas
3. **Decorators funcionam automaticamente** - Guards globais processam os metadados

````

### Múltiplas Roles por Usuário

```typescript
// Usuário com múltiplas roles
const user = {
  id: 1,
  email: 'joao@empresa.com',
  roles: [UserRoleEnum.DEVELOPER, UserRoleEnum.SUPPORT]
};

// ✅ Pode acessar rotas que exigem DEVELOPER
// ✅ Pode acessar rotas que exigem SUPPORT
// ✅ Pode acessar rotas hierárquicas de USER
// ❌ NÃO pode acessar rotas que exigem RH ou ADMIN
````

### Cenários de Acesso Real

```typescript
// Exemplo: Usuário com role [MANAGER]
const manager = { roles: [UserRoleEnum.MANAGER] };

@RequireRH()        // ❌ Bloqueado (MANAGER < RH)
@RequireManager()   // ✅ Permitido (MANAGER = MANAGER)
@RequireAdmin()     // ❌ Bloqueado (MANAGER < ADMIN)
@OnlyAdmin()        // ❌ Bloqueado (não é exatamente ADMIN)

// Exemplo: Usuário com role [ADMIN]
const admin = { roles: [UserRoleEnum.ADMIN] };

@RequireRH()        // ✅ Permitido (ADMIN > RH)
@RequireManager()   // ✅ Permitido (ADMIN > MANAGER)
@RequireAdmin()     // ✅ Permitido (ADMIN = ADMIN)
@OnlyAdmin()        // ✅ Permitido (é exatamente ADMIN)
```

## 🧪 Testes com curl

### 1. Criar usuário admin

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "123456",
    "roles": ["ADMIN"]
  }'
```

### 2. Login e obter token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "123456"
  }'
```

### 3. Usar token nas requisições

```bash
# Salvar token
TOKEN="seu_jwt_token_aqui"

# Acessar rota protegida
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Testar diferentes níveis de acesso

```bash
# Criar usuário com múltiplas roles
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@empresa.com",
    "password": "123456",
    "roles": ["DEVELOPER", "SUPPORT"]
  }'

# Fazer login com o novo usuário
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@empresa.com",
    "password": "123456"
  }'

# Testar acesso (deve funcionar - DEVELOPER tem nível 4)
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $DEV_TOKEN"

# Testar acesso admin (deve falhar - não é ADMIN)
curl -X DELETE http://localhost:3000/users/1 \
  -H "Authorization: Bearer $DEV_TOKEN"
```

## ✅ Boas Práticas

### 1. **Guards são aplicados globalmente - não precisa declarar**

```typescript
@Controller('exemplo')
export class ExemploController {
    // ✅ Guards já aplicados automaticamente
    @RequireAdmin()
    exemploAdmin() {}

    @RequireRH()
    exemploRH() {}
}
```

### 2. **Use @Public() para rotas públicas**

```typescript
// ✅ Torna a rota acessível sem autenticação
@Get('health')
@Public()
healthCheck() {
  return { status: 'ok' };
}
```

### 3. **Prefira decorators específicos para clareza**

```typescript
// ✅ Bom - intent claro
@RequireRH()
@RequireManager()
@RequireAdmin()

// ⚠️ Funciona, mas menos claro
@Roles(UserRoleEnum.RH)
@Roles(UserRoleEnum.MANAGER)
@Roles(UserRoleEnum.ADMIN)
```

### 3. **Use @ExactRoles apenas quando necessário**

```typescript
// ✅ Casos válidos para @ExactRoles:
// - Ferramentas específicas de uma role
// - Fluxos que não devem ser acessados por superiores
@ExactRoles(UserRoleEnum.DEVELOPER) // Só desenvolvedores
@ExactRoles(UserRoleEnum.SUPPORT, UserRoleEnum.MANAGER) // Múltiplas roles específicas
```

### 4. **Documumente permissões complexas**

```typescript
@Get('relatorio-especial')
@ExactRoles(UserRoleEnum.MANAGER, UserRoleEnum.RH)
// Este relatório é específico para managers e RH
// ADMINs devem usar o relatório completo em /admin/relatorios
getRelatorioEspecial() {
  // ...
}
```

### 6. **Valide roles no frontend também**

```typescript
// No frontend, use as mesmas regras
const canAccess = (userRoles: string[], requiredRole: string) => {
    return userRoles.some((role) => getRoleLevel(role) >= getRoleLevel(requiredRole));
};
```

### 7. **Trate erros de autorização**

O sistema retorna automaticamente:

- `401 Unauthorized` - Token inválido ou ausente
- `403 Forbidden` - Token válido mas sem permissão

### 8. **Monitore acessos**

Considere adicionar logs para auditoria:

```typescript
@Post('acao-critica')
@RequireAdmin()
acaoCritica(@CurrentUser() user: any) {
  console.log(`Admin ${user.email} executou ação crítica`);
  // ...
}
```

## 🚨 Erros Comuns

### 1. **Tentar usar @UseGuards desnecessariamente**

```typescript
// ❌ Erro - guards globais já aplicados
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // DESNECESSÁRIO!
export class UserController {
    @RequireAdmin()
    getUsers() {}
}

// ✅ Correto - guards globais funcionam automaticamente
@Controller('users')
export class UserController {
    @RequireAdmin() // Funciona perfeitamente!
    getUsers() {}
}
```

### 2. **Esquecer @Public() em rotas públicas**

```typescript
// ❌ Erro - rota será protegida por padrão
@Get('health')
getHealth() {
  return { status: 'ok' }; // Exigirá autenticação!
}

// ✅ Correto
@Get('health')
@Public()
getHealth() {
  return { status: 'ok' }; // Rota pública
}
```

### 3. **Confundir @Roles com @ExactRoles**

```typescript
// Se user tem [ADMIN]:

@Roles(UserRoleEnum.MANAGER)        // ✅ Permite (ADMIN > MANAGER)
@ExactRoles(UserRoleEnum.MANAGER)   // ❌ Bloqueia (não é exatamente MANAGER)
@RequireManager()                   // ✅ Permite (ADMIN > MANAGER)
@OnlyAdmin()                        // ✅ Permite (é exatamente ADMIN)
```

### 4. **Não entender a hierarquia de roles**

```typescript
// Hierarquia: ADMIN > RH > MANAGER > DEVELOPER > SUPPORT > USER

// Um usuário MANAGER pode acessar:
@RequireManager()    // ✅ Sim (é MANAGER)
@RequireRH()         // ❌ Não (MANAGER < RH)
@RequireAdmin()      // ❌ Não (MANAGER < ADMIN)

// Um usuário ADMIN pode acessar:
@RequireManager()    // ✅ Sim (ADMIN > MANAGER)
@RequireRH()         // ✅ Sim (ADMIN > RH)
@RequireAdmin()      // ✅ Sim (é ADMIN)
```

### 5. **Não tratar usuários sem roles**

O sistema automaticamente bloqueia usuários sem roles ativas.

---

💡 **Dúvidas?** Consulte os testes em `test/` ou os exemplos em `src/auth/` e `src/user/`.

## 🔧 Configuração dos Guards Globais

Lembre-se: os guards estão configurados globalmente no `src/app.module.ts`:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,    // ← Autenticação automática
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,      // ← Autorização automática
  },
],
```

**Por isso você não precisa usar `@UseGuards()` em lugar nenhum!** 🎉
