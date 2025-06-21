# ─── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

# 1. ativa o pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

# 2. copia apenas o que precisa pro install (cache friendly)
COPY package.json pnpm-lock.yaml ./

# 3. instala dependências
RUN pnpm install --frozen-lockfile

# 4. copia o resto do código
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
# Se você usa Prisma:
COPY prisma ./prisma

# 5. gera client do Prisma e compila o projeto
RUN pnpm prisma generate
RUN pnpm build

# ─── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:18-alpine

# pnpm no runtime também
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

# 1. traz node_modules e build
COPY package.json pnpm-lock.yaml ./  
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
# se usar Prisma, precisa do schema em runtime
COPY --from=builder /usr/src/app/prisma ./prisma

COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

# 2. define variáveis (leia seu .env via docker-compose ou aqui)
ENV NODE_ENV=production
ENV PORT=3000
# ENV DATABASE_URL será definida no docker-compose

# 3. expõe porta do Nest (3001 conforme seu package.json)
EXPOSE 3000

# 4. comando de start otimizado
CMD ["./scripts/start.sh"]
