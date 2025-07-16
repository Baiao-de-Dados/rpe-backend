# Formato da Avaliação do Manager

## Visão Geral

O endpoint `/manager/evaluate` agora usa **exatamente a mesma estrutura** do endpoint `/evaluations` (autoavaliação), porque o manager está preenchendo o mesmo formulário que o colaborador preencheu.

## Endpoints Disponíveis

### 1. POST /manager/evaluate
Cria ou atualiza a avaliação do manager para um colaborador.

### 2. GET /manager/evaluation/:collaboratorId
Busca a avaliação do manager para um colaborador específico.

## Estrutura do Request

### Endpoint POST

```http
POST /manager/evaluate
```

### Exemplo de Body

```json
{
    "cycleConfigId": 1,
    "managerId": 10,
    "colaboradorId": 20,
    "autoavaliacao": {
        "pilares": [
            {
                "pilarId": 1,
                "criterios": [
                    {
                        "criterioId": 1,
                        "nota": 5,
                        "justificativa": "Excelente desempenho em liderança."
                    },
                    {
                        "criterioId": 2,
                        "nota": 4,
                        "justificativa": "Boa comunicação, mas pode melhorar."
                    }
                ]
            },
            {
                "pilarId": 2,
                "criterios": [
                    {
                        "criterioId": 3,
                        "nota": 4,
                        "justificativa": "Bom trabalho em equipe."
                    },
                    {
                        "criterioId": 4,
                        "nota": 3,
                        "justificativa": "Precisa melhorar organização."
                    }
                ]
            }
        ]
    }
}
```

## Endpoint GET

### URL
```http
GET /manager/evaluation/:collaboratorId?cycleConfigId=1
```

### Parâmetros
- `collaboratorId` (path): ID do colaborador
- `cycleConfigId` (query): ID do ciclo de avaliação

### Exemplo de Resposta

```json
{
    "id": 1,
    "cycleConfigId": 1,
    "managerId": 10,
    "collaboratorId": 20,
    "autoavaliacao": {
        "pilares": [
            {
                "pilarId": 1,
                "criterios": [
                    {
                        "criterioId": 1,
                        "nota": 5,
                        "justificativa": "Excelente desempenho em liderança."
                    }
                ]
            }
        ]
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Resposta quando não há avaliação

```json
{
    "id": null,
    "cycleConfigId": 1,
    "managerId": 10,
    "collaboratorId": 20,
    "autoavaliacao": {
        "pilares": []
    },
    "createdAt": null,
    "updatedAt": null
}
```

## Campos Detalhados

### 1. `cycleConfigId` (number)
- ID do ciclo de avaliação

### 2. `managerId` (number)
- ID do gestor que está fazendo a avaliação

### 3. `colaboradorId` (number)
- ID do colaborador sendo avaliado

### 4. `autoavaliacao` (objeto)
- **EXATAMENTE** a mesma estrutura da autoavaliação do colaborador
- **pilares**: array de pilares avaliados
  - **pilarId**: number (ID do pilar)
  - **criterios**: array de critérios
    - **criterioId**: number (ID do critério)
    - **nota**: number (nota atribuída, de 1 a 5)
    - **justificativa**: string (justificativa da nota)

## Validações

1. **Autenticação**: O managerId deve ser igual ao ID do usuário autenticado
2. **Permissão**: O colaborador deve pertencer a um projeto sob gestão do manager
3. **Critérios**: Os critérios devem pertencer à trilha do colaborador
4. **Notas**: As notas devem estar entre 1 e 5

## Resposta

A resposta inclui a avaliação criada/atualizada com todos os critérios organizados por pilar:

```json
{
    "id": 1,
    "cycleId": 1,
    "managerId": 10,
    "collaboratorId": 20,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "criterias": [
        {
            "id": 1,
            "criteriaId": 1,
            "score": 5,
            "justification": "Excelente desempenho em liderança.",
            "criteria": {
                "id": 1,
                "name": "Liderança",
                "description": "Capacidade de liderar equipes"
            }
        }
    ]
}
```

## Mudanças Realizadas

1. **DTO Unificado**: `ManagerEvaluationDto` agora usa `AutoAvaliacaoDto` diretamente
2. **Estrutura Idêntica**: Mesma estrutura da autoavaliação do colaborador
3. **Reutilização de Código**: Usa os mesmos DTOs da autoavaliação
4. **Consistência Total**: Frontend pode usar exatamente o mesmo formulário
5. **Novo Endpoint GET**: Permite buscar avaliação existente

## Benefícios

1. **Simplicidade**: Mesmo formulário para colaborador e manager
2. **Consistência**: Estrutura 100% idêntica
3. **Manutenibilidade**: Menos código duplicado
4. **UX**: Interface unificada no frontend
5. **Flexibilidade**: Pode buscar avaliações existentes

## Comparação

**Antes (estrutura diferente):**
```json
{
    "cycleId": 1,
    "managerId": 10,
    "collaboratorId": 20,
    "pilares": [...]
}
```

**Agora (estrutura idêntica):**
```json
{
    "cycleConfigId": 1,
    "managerId": 10,
    "colaboradorId": 20,
    "autoavaliacao": {
        "pilares": [...]
    }
}
```

O manager agora preenche **exatamente o mesmo formulário** que o colaborador preencheu! 🎉 