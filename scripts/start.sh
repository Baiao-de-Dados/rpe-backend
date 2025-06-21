#!/bin/sh

echo "🚀 Iniciando aplicação..."

echo "📊 Executando migrações do Prisma..."
npx prisma migrate deploy

echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "🎯 Iniciando servidor..."
node dist/src/main.js