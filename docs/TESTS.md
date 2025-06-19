# Exemplos de Teste - RPE Backend

## Fluxo Simples de Teste (2 Funcionários)

### 1. Criar Primeiro Funcionário (POST /auth/register)

```json
{
    "email": "joao@empresa.com",
    "password": "senha123",
    "name": "João Silva"
}
```

### 2. Criar Segundo Funcionário (POST /auth/register)

```json
{
    "email": "maria@empresa.com",
    "password": "senha123",
    "name": "Maria Santos"
}
```

### 3. Criar Pilar (POST /pillars)

```json
{
    "name": "Competências Técnicas",
    "description": "Avaliação das habilidades técnicas"
}
```

### 4. Criar Critério (POST /criteria)

```json
{
    "name": "Conhecimento Técnico",
    "description": "Domínio das tecnologias utilizadas",
    "weight": 0.5,
    "pillarId": 1
}
```

### 5. Criar Tag (POST /tags)

```json
{
    "name": "Desenvolvedor"
}
```

### 6. Criar Avaliação Completa (POST /evaluations)

```json
{
    "ciclo": "2024-Q1",
    "colaboradorId": 1,
    "autoavaliacao": {
        "pilares": [
            {
                "pilarId": 1,
                "criterios": [
                    {
                        "criterioId": 1,
                        "nota": 8.0,
                        "justificativa": "Tenho bom domínio das tecnologias utilizadas no projeto"
                    }
                ]
            }
        ]
    },
    "avaliacao360": [
        {
            "avaliadoId": 2,
            "pontosFortes": "Ótima comunicação",
            "pontosMelhoria": "Precisa melhorar prazos",
            "justificativa": "Avaliação baseada no trabalho em equipe"
        }
    ],
    "mentoring": [
        {
            "mentorId": 2,
            "justificativa": "Acompanhamento semanal para desenvolvimento"
        }
    ],
    "referencias": [
        {
            "colaboradorId": 2,
            "justificativa": "Referência técnica para projetos",
            "tagIds": [1]
        }
    ]
}
```

## Endpoints Disponíveis

### Autenticação

- `POST /auth/register` - Registrar usuário
- `POST /auth/login` - Fazer login

### Pilares

- `GET /pillars` - Listar todos os pilares
- `POST /pillars` - Criar pilar
- `GET /pillars/:id` - Buscar pilar por ID
- `PATCH /pillars/:id` - Atualizar pilar
- `DELETE /pillars/:id` - Remover pilar

### Critérios

- `GET /criteria` - Listar todos os critérios
- `POST /criteria` - Criar critério
- `GET /criteria/:id` - Buscar critério por ID
- `GET /criteria/pillar/:pillarId` - Listar critérios por pilar
- `PATCH /criteria/:id` - Atualizar critério
- `DELETE /criteria/:id` - Remover critério

### Tags

- `GET /tags` - Listar todas as tags
- `POST /tags` - Criar tag
- `GET /tags/:id` - Buscar tag por ID
- `PATCH /tags/:id` - Atualizar tag
- `DELETE /tags/:id` - Remover tag

### Avaliações

- `GET /evaluations` - Listar todas as avaliações
- `POST /evaluations` - Criar avaliação
- `GET /evaluations/:id` - Buscar avaliação por ID

### Usuários

- `GET /users` - Listar todos os usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Buscar usuário por ID
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Remover usuário

## Fluxo de Teste Recomendado

1. **Criar 2 usuários** (João e Maria)
2. **Criar 1 pilar** (Competências Técnicas)
3. **Criar 1 critério** (Conhecimento Técnico)
4. **Criar 1 tag** (Desenvolvedor)
5. **Criar avaliação completa** usando todos os IDs criados

## Documentação Swagger

Acesse: `http://localhost:3001/api`
