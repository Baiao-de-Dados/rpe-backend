#!/bin/bash

API_URL="http://localhost:3002/auth"

echo "Criando admin (caso não exista)..."
curl -s -X POST "$API_URL/setup-admin" -H "Content-Type: application/json"
echo -e "\n"

echo "Logando admin..."
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/login" -H "Content-Type: application/json" -d '{"email":"admin@test.com","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -oP '(?<="accessToken":")[^"]+')

if [ -z "$ADMIN_TOKEN" ]; then
    echo "Falha ao obter token do admin. Verifique se o admin foi criado corretamente."
    exit 1
fi

echo "Token do admin obtido."

echo "Criando usuário RH..."
curl -s -X POST "$API_URL/create-user" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "email": "rh@empresa.com",
        "password": "senhaSegura123",
        "name": "Usuário RH",
        "roles": ["RH"]
    }'
echo -e "\n"

echo "Processo finalizado."