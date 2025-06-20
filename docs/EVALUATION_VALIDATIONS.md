# Validações de Integridade - Avaliações

## Visão Geral

Implementamos validações robustas que garantem a integridade dos dados antes de criar qualquer avaliação. Se qualquer validação falhar, **nada** será criado no banco de dados.

## Validações Implementadas

### 1. **Existência do Colaborador**

- ✅ Verifica se o colaborador principal existe
- ❌ Erro: `Colaborador com ID X não encontrado`

### 2. **Avaliação Única por Ciclo**

- ✅ Verifica se não existe avaliação para o mesmo colaborador no mesmo ciclo
- ❌ Erro: `Já existe uma avaliação para o colaborador X no ciclo Y`

### 3. **Critérios Existentes**

- ✅ Verifica se todos os critérios da autoavaliação existem
- ❌ Erro: `Critérios não encontrados: 1, 2, 3`

### 4. **Avaliados da Avaliação360 Existem**

- ✅ Verifica se todos os avaliados da avaliação360 existem
- ❌ Erro: `Avaliados não encontrados: 1, 2, 3`

### 5. **Mentores Existem**

- ✅ Verifica se todos os mentores existem
- ❌ Erro: `Mentores não encontrados: 1, 2, 3`

### 6. **Colaboradores de Referência Existem**

- ✅ Verifica se todos os colaboradores das referências existem
- ❌ Erro: `Colaboradores de referência não encontrados: 1, 2, 3`

### 7. **Tags Existem**

- ✅ Verifica se todas as tags das referências existem
- ❌ Erro: `Tags não encontradas: 1, 2, 3`

### 8. **Sem Duplicatas na Avaliação360**

- ✅ Verifica se não há colaboradores duplicados na avaliação360
- ❌ Erro: `Não é possível avaliar o mesmo colaborador múltiplas vezes na avaliação360`

### 9. **Sem Duplicatas no Mentoring**

- ✅ Verifica se não há mentores duplicados
- ❌ Erro: `Não é possível ter o mesmo mentor múltiplas vezes`

### 10. **Sem Duplicatas nas Referências**

- ✅ Verifica se não há colaboradores duplicados nas referências
- ❌ Erro: `Não é possível referenciar o mesmo colaborador múltiplas vezes`

### 11. **Sem Auto-avaliação360**

- ✅ Verifica se o colaborador não está se auto-avaliando na avaliação360
- ❌ Erro: `O colaborador não pode se auto-avaliar na avaliação360`

### 12. **Sem Auto-mentoria**

- ✅ Verifica se o colaborador não está se auto-mentorando
- ❌ Erro: `O colaborador não pode ser seu próprio mentor`

### 13. **Sem Auto-referência**

- ✅ Verifica se o colaborador não está se auto-referenciando
- ❌ Erro: `O colaborador não pode se auto-referenciar`

## Transação

- ✅ **Atomicidade**: Se qualquer parte falhar, nada é criado
- ✅ **Consistência**: Todos os dados são válidos antes da criação
- ✅ **Isolamento**: Outras operações não interferem
- ✅ **Durabilidade**: Se sucesso, todos os dados são persistidos

## Como Testar

### 1. **Teste de Sucesso**

```bash
curl -X POST http://localhost:3001/evaluations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_rh>" \
  -d '{
    "ciclo": "2024-Q1",
    "colaboradorId": 1,
    "autoavaliacao": {
      "justificativa": "Autoavaliação completa",
      "pilares": [
        {
          "pilarId": 1,
          "criterios": [
            {
              "criterioId": 1,
              "nota": 8,
              "justificativa": "Bom desempenho"
            }
          ]
        }
      ]
    },
    "avaliacao360": [
      {
        "avaliadoId": 2,
        "pontosFortes": "Boa comunicação",
        "pontosMelhoria": "Pode melhorar documentação",
        "justificativa": "Avaliação 360 completa"
      }
    ],
    "mentoring": [
      {
        "mentorId": 3,
        "justificativa": "Mentoria necessária"
      }
    ],
    "referencias": [
      {
        "colaboradorId": 4,
        "tagIds": [1, 2],
        "justificativa": "Boa referência"
      }
    ]
  }'
```

### 2. **Teste de Colaborador Inexistente**

```bash
curl -X POST http://localhost:3001/evaluations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_rh>" \
  -d '{
    "ciclo": "2024-Q1",
    "colaboradorId": 999,  # ID inexistente
    "autoavaliacao": { ... },
    "avaliacao360": [],
    "mentoring": [],
    "referencias": []
  }'
```

### 3. **Teste de Auto-avaliação360**

```bash
curl -X POST http://localhost:3001/evaluations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_rh>" \
  -d '{
    "ciclo": "2024-Q1",
    "colaboradorId": 1,
    "autoavaliacao": { ... },
    "avaliacao360": [
      {
        "avaliadoId": 1,  # Mesmo ID do colaborador
        "justificativa": "Auto-avaliação"
      }
    ],
    "mentoring": [],
    "referencias": []
  }'
```

### 4. **Teste de Duplicatas**

```bash
curl -X POST http://localhost:3001/evaluations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_rh>" \
  -d '{
    "ciclo": "2024-Q1",
    "colaboradorId": 1,
    "autoavaliacao": { ... },
    "avaliacao360": [
      {
        "avaliadoId": 2,
        "justificativa": "Primeira avaliação"
      },
      {
        "avaliadoId": 2,  # Duplicado
        "justificativa": "Segunda avaliação"
      }
    ],
    "mentoring": [],
    "referencias": []
  }'
```

## Benefícios

1. **Integridade Garantida**: Nenhum dado inválido é criado
2. **Rollback Automático**: Se algo falhar, tudo é desfeito
3. **Mensagens Claras**: Erros específicos para cada problema
4. **Performance**: Validações rápidas antes de operações custosas
5. **Manutenibilidade**: Código organizado e fácil de debugar

## Logs

Quando todas as validações passam:

```
✅ Todas as validações passaram com sucesso
```

Quando uma validação falha:

```
❌ [Tipo do erro]: [Descrição específica]
```
