# Testando o Sistema de Configuração de Ciclos

## Visão Geral

O sistema permite que o RH configure quais critérios e pilares estarão ativos em cada ciclo de avaliação. Os funcionários só podem avaliar critérios que estejam ativos no ciclo atual.

## Endpoints Disponíveis

### 1. Configuração de Ciclos (RH)

#### Criar Ciclo de Avaliação

```http
POST /cycle-config
Content-Type: application/json

{
  "name": "2025.1",
  "description": "Ciclo de avaliação 2025.1",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-06-30T23:59:59Z",
  "isActive": true,
  "pillarConfigs": [
    {
      "pillarId": 1,
      "isActive": true,
      "weight": 1.0
    },
    {
      "pillarId": 2,
      "isActive": true,
      "weight": 1.0
    }
  ],
  "criterionConfigs": [
    {
      "criterionId": 1,
      "isActive": true,
      "weight": 1.0
    },
    {
      "criterionId": 2,
      "isActive": true,
      "weight": 1.0
    },
    {
      "criterionId": 3,
      "isActive": false,
      "weight": 0.0
    }
  ]
}
```

#### Listar Ciclos

```http
GET /cycle-config
```

#### Buscar Ciclo Ativo

```http
GET /cycle-config/active
```

#### Atualizar Ciclo

```http
PUT /cycle-config/1
Content-Type: application/json

{
  "isActive": false
}
```

### 2. Consulta de Critérios Ativos (Funcionários)

#### Critérios Ativos (Lista Simples)

```http
GET /evaluations/active-criteria
```

**Resposta:**

```json
{
    "criteria": [
        {
            "id": 1,
            "name": "Qualidade do Código",
            "description": "Avalia a qualidade do código produzido",
            "weight": 1.0,
            "pillar": {
                "id": 1,
                "name": "Técnico",
                "description": "Pilar técnico"
            }
        },
        {
            "id": 2,
            "name": "Documentação",
            "description": "Avalia a documentação produzida",
            "weight": 1.0,
            "pillar": {
                "id": 1,
                "name": "Técnico",
                "description": "Pilar técnico"
            }
        }
    ]
}
```

#### Critérios Ativos Agrupados por Pilar

```http
GET /evaluations/active-criteria/grouped
```

**Resposta:**

```json
[
    {
        "id": 1,
        "name": "Técnico",
        "description": "Pilar técnico",
        "criterios": [
            {
                "id": 1,
                "name": "Qualidade do Código",
                "description": "Avalia a qualidade do código produzido",
                "weight": 1.0
            },
            {
                "id": 2,
                "name": "Documentação",
                "description": "Avalia a documentação produzida",
                "weight": 1.0
            }
        ]
    },
    {
        "id": 2,
        "name": "Comportamental",
        "description": "Pilar comportamental",
        "criterios": [
            {
                "id": 3,
                "name": "Trabalho em Equipe",
                "description": "Avalia o trabalho em equipe",
                "weight": 1.0
            }
        ]
    }
]
```

## Fluxo de Teste

### 1. Configurar Ciclo (RH)

1. Criar um ciclo de avaliação com critérios e pilares ativos
2. Verificar se o ciclo foi criado corretamente
3. Verificar se apenas um ciclo pode estar ativo por vez

### 2. Consultar Critérios Ativos (Funcionário)

1. Buscar critérios ativos do ciclo atual
2. Verificar se apenas critérios configurados como ativos aparecem
3. Verificar se os pesos estão corretos

### 3. Criar Autoavaliação (Funcionário)

1. Tentar criar autoavaliação com critérios ativos (deve funcionar)
2. Tentar criar autoavaliação com critérios inativos (deve falhar)
3. Verificar se a validação funciona corretamente

## Exemplo de Autoavaliação Válida

```http
POST /evaluations
Content-Type: application/json

{
  "ciclo": "2025.1",
  "colaboradorId": "1",
  "autoavaliacao": {
    "pilares": [
      {
        "pilarId": "1",
        "criterios": [
          {
            "criterioId": "1",
            "nota": 8,
            "justificativa": "Código bem estruturado e documentado"
          },
          {
            "criterioId": "2",
            "nota": 7,
            "justificativa": "Documentação adequada"
          }
        ]
      }
    ]
  },
  "avaliacao360": [],
  "mentoring": [],
  "referencias": []
}
```

## Exemplo de Autoavaliação Inválida

```http
POST /evaluations
Content-Type: application/json

{
  "ciclo": "2025.1",
  "colaboradorId": "1",
  "autoavaliacao": {
    "pilares": [
      {
        "pilarId": "1",
        "criterios": [
          {
            "criterioId": "3", // Critério inativo
            "nota": 8,
            "justificativa": "Este critério não está ativo"
          }
        ]
      }
    ]
  },
  "avaliacao360": [],
  "mentoring": [],
  "referencias": []
}
```

**Resposta de Erro:**

```json
{
    "message": "Critério com ID 3 não está ativo no ciclo atual",
    "error": "Bad Request",
    "statusCode": 400
}
```

## Benefícios do Sistema

1. **Flexibilidade**: RH pode ativar/desativar critérios por ciclo
2. **Controle**: Apenas critérios configurados podem ser avaliados
3. **Pesos Dinâmicos**: Pode ajustar pesos dos critérios por ciclo
4. **Validação Automática**: Sistema valida automaticamente critérios ativos
5. **Organização**: Critérios organizados por pilar para facilitar uso
