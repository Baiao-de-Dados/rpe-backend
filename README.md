# 🚀 RPE Backend

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

Sistema de **Avaliação de Performance de Colaboradores** (RPE) da RocketCorp. Uma API robusta e escalável construída com NestJS para gerenciar ciclos de avaliação, feedback 360°, mentoria e relatórios de performance empresarial.

## 📋 Índice

- [🎯 Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias](#️-tecnologias)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🚀 Instalação e Configuração](#-instalação-e-configuração)
- [🐳 Docker](#-docker)
- [🗄️ Banco de Dados](#️-banco-de-dados)
- [📚 Documentação da API](#-documentação-da-api)
- [🧪 Testes](#-testes)
- [🔐 Segurança](#-segurança)
- [📋 Scripts Disponíveis](#-scripts-disponíveis)

## 🎯 Funcionalidades

### 👥 Gestão de Usuários
- Autenticação JWT com roles hierárquicos
- Perfis de usuário personalizados
- Sistema de permissões avançado

### 📊 Avaliações de Performance
- **Autoavaliação**: Colaboradores avaliam seu próprio desempenho
- **Avaliação 360°**: Feedback multidirecional de pares, gestores e subordinados
- **Avaliação Gerencial**: Avaliações conduzidas por gestores
- **Avaliação de Liderança**: Feedback específico para líderes

### 🔄 Gestão de Ciclos
- Criação e configuração de ciclos de avaliação
- Controle de prazos e status
- Acompanhamento de progresso

### 🤖 Integração com IA
- Análise automática de feedback com Google GenAI
- Sugestões de melhorias baseadas em IA
- Equalização inteligente de avaliações

### 📈 Relatórios e Analytics
- Dashboards de performance
- Exportação de dados em Excel
- Métricas de progresso individual e por equipe

### 💾 Import/Export
- Importação em massa de usuários e avaliações
- Exportação de relatórios
- Validação automática de dados

## 🛠️ Tecnologias

### Core
- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeScript](https://www.typescriptlang.org/)** - Superset tipado do JavaScript
- **[Prisma](https://www.prisma.io/)** - ORM moderno para TypeScript

### Banco de Dados
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional

### Autenticação & Segurança
- **[JWT](https://jwt.io/)** - JSON Web Tokens
- **[Passport](http://www.passportjs.org/)** - Middleware de autenticação
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Hash de senhas
- **Criptografia** de campos sensíveis

### Documentação & Validação
- **[Swagger](https://swagger.io/)** - Documentação automática da API
- **[class-validator](https://github.com/typestack/class-validator)** - Validação de DTOs
- **[class-transformer](https://github.com/typestack/class-transformer)** - Transformação de objetos

### Integração IA
- **[Google GenAI](https://ai.google.dev/)** - Análise inteligente de feedback

### DevOps & Qualidade
- **[Docker](https://www.docker.com/)** - Containerização
- **[Jest](https://jestjs.io/)** - Framework de testes
- **[ESLint](https://eslint.org/)** - Linter para código
- **[Prettier](https://prettier.io/)** - Formatador de código
- **[Husky](https://typicode.github.io/husky/)** - Git hooks

## 📁 Estrutura do Projeto

```
src/
├── ai/                 # Integração com IA (Google GenAI)
├── auth/               # Autenticação e autorização
├── common/             # Utilitários e decorators compartilhados
├── cryptography/       # Sistema de criptografia
├── cycles/             # Gestão de ciclos de avaliação
├── evaluations/        # Sistema de avaliações
├── import-export/      # Funcionalidades de import/export
├── log/                # Sistema de logs
├── notes/              # Sistema de anotações
├── prisma/             # Configuração do Prisma
├── track/              # Rastreamento de atividades
└── user/               # Gestão de usuários
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **pnpm** (gerenciador de pacotes)
- **PostgreSQL** (v15 ou superior)
- **Docker** (opcional)

### 1. Clone o repositório
```bash
git clone <repository-url>
cd rpe-backend
```

### 2. Instale as dependências
```bash
pnpm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações ou olhe o `env.example`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rpe_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# AI Integration
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# App
PORT=3000
NODE_ENV=development
```

### 4. Configure o banco de dados
```bash
# Gerar cliente Prisma
pnpm db:generate

# Executar migrações
pnpm db:migrate

# Executar seed (dados iniciais)
pnpm prisma db seed
```

### 5. Inicie a aplicação
```bash
# Modo desenvolvimento
pnpm start:dev

# Modo produção
pnpm build
pnpm start:prod
```

## 🐳 Docker

### Desenvolvimento com Docker Compose

```bash
# Subir apenas o banco de dados
pnpm db:up

# Subir toda a aplicação
pnpm db:run

# Parar os containers
pnpm db:down
```

### Build da imagem
```bash
# Build da aplicação
pnpm db:build
```

## 🗄️ Banco de Dados

### Scripts úteis
```bash
# Prisma Studio (Interface visual)
pnpm db:studio

# Reset do banco (⚠️ Cuidado em produção)
pnpm prisma migrate reset

# Deploy de migrações
pnpm db:deploy
```

### Estrutura principal
- **Users**: Usuários do sistema
- **Cycles**: Ciclos de avaliação
- **Evaluations**: Diferentes tipos de avaliação
- **Projects**: Projetos e membros
- **Logs**: Auditoria do sistema

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger:

```
http://localhost:3000/api
```

### Principais endpoints:

- **Auth**: `/auth` - Autenticação e registro
- **Users**: `/users` - Gestão de usuários
- **Cycles**: `/cycles` - Ciclos de avaliação
- **Evaluations**: `/evaluations` - Sistema de avaliações
- **AI**: `/ai` - Funcionalidades de IA

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes em modo watch
pnpm test:watch

# Testes de cobertura
pnpm test:cov

# Testes E2E
pnpm test:e2e
```

## 🔐 Segurança

### Implementações de Segurança

- **Autenticação JWT** com refresh tokens
- **Criptografia** de campos sensíveis (emails, feedback)
- **Validação rigorosa** de entrada com class-validator
- **Rate limiting** e proteção contra ataques
- **Logs de auditoria** completos
- **CORS configurado** para ambientes específicos

### Roles e Permissões

```typescript
enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', 
  LEADER = 'LEADER',
  EMPLOYER = 'EMPLOYER'
}
```

## 📋 Scripts Disponíveis

### Desenvolvimento
```bash
pnpm start:dev      # Inicia em modo desenvolvimento
pnpm start:debug    # Inicia com debug habilitado
pnpm build          # Build da aplicação
```

### Banco de Dados
```bash
pnpm db:up          # Sobe containers do banco
pnpm db:migrate     # Executa migrações
pnpm db:generate    # Gera cliente Prisma
pnpm db:studio      # Abre Prisma Studio
```

### Qualidade de Código
```bash
pnpm lint           # Executa ESLint
pnpm format         # Formata código com Prettier
pnpm test           # Executa testes
```

### Utilitários
```bash
pnpm prepare        # Configura Husky (hooks)
```

---

<p align="center">
  Desenvolvido com ❤️ para a <strong>RocketCorp</strong>
</p>
