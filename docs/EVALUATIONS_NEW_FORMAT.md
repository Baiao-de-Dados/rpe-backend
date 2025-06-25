# Formato Completo de Avaliações

## Visão Geral

O endpoint `/evaluations` permite o envio de avaliações de diferentes tipos em um único request. O backend processa e armazena cada avaliação de acordo com o tipo, mantendo compatibilidade e flexibilidade para o frontend.

Os tipos de avaliação suportados são:

- **Autoavaliação** (autoavaliacao)
- **Peer 360** (avaliacao360)
- **Mentor** (mentoring)
- **Líder** (integrado em mentoring)
- **Referências** (referencias)

---

## Estrutura do Request

### Endpoint

```http
POST /evaluations
```

### Exemplo Completo de Body

```json
{
    "ciclo": "2025.1",
    "colaboradorId": "1",
    "autoavaliacao": {
        "pilares": [
            {
                "pilarId": "10",
                "criterios": [
                    {
                        "criterioId": "1",
                        "nota": 3,
                        "justificativa": "Justifique sua nota"
                    },
                    {
                        "criterioId": "2",
                        "nota": 4,
                        "justificativa": "Me mostrei resiliente em situações complicadas"
                    }
                ]
            }
        ]
    },
    "avaliacao360": [
        {
            "avaliadoId": "2",
            "pontosFortes": "Ótimo trabalho em equipe",
            "pontosMelhoria": "Precisa melhorar organização",
            "justificativa": "Justifique sua nota"
        }
    ],
    "mentoring": [
        {
            "mentorId": "3",
            "justificativa": "Justifique sua avaliação do mentor",
            "leaderId": "4",
            "leaderJustificativa": "Justifique sua avaliação do líder"
        }
    ],
    "referencias": [
        {
            "colaboradorId": "5",
            "tagIds": [1, 2, 5],
            "justificativa": "Justifique sua escolha"
        }
    ]
}
```

---

## Campos Detalhados

### 1. `ciclo` (string)

- Ciclo/período da avaliação (ex: "2025.1")

### 2. `colaboradorId` (string)

- ID do colaborador avaliado

### 3. `autoavaliacao` (objeto)

Avaliação feita pelo próprio colaborador.

```json
"autoavaliacao": {
  "pilares": [
    {
      "pilarId": "10",
      "criterios": [
        {
          "criterioId": "1",
          "nota": 3,
          "justificativa": "Justifique sua nota"
        }
      ]
    }
  ]
}
```

- **pilares**: array de pilares avaliados
    - **pilarId**: string (ID do pilar)
    - **criterios**: array de critérios
        - **criterioId**: string (ID do critério)
        - **nota**: number (nota atribuída)
        - **justificativa**: string (justificativa da nota)

### 4. `avaliacao360` (array de objetos)

Avaliação feita por outros colaboradores (peer review).

```json
"avaliacao360": [
  {
    "avaliadoId": "2",
    "pontosFortes": "Ótimo trabalho em equipe",
    "pontosMelhoria": "Precisa melhorar organização",
    "justificativa": "Justifique sua nota"
  }
]
```

- **avaliadoId**: string (ID do avaliado)
- **pontosFortes**: string (opcional)
- **pontosMelhoria**: string (opcional)
- **justificativa**: string (obrigatório)

### 5. `mentoring` (array de objetos)

Avaliação de mentor e/ou líder. Cada objeto pode conter avaliação de mentor, líder ou ambos.

```json
"mentoring": [
  {
    "mentorId": "3",
    "justificativa": "Justifique sua avaliação do mentor",
    "leaderId": "4",
    "leaderJustificativa": "Justifique sua avaliação do líder"
  }
]
```

- **mentorId**: string (ID do mentor, obrigatório para avaliação de mentor)
- **justificativa**: string (obrigatório para avaliação de mentor)
- **leaderId**: string (ID do líder, obrigatório para avaliação de líder)
- **leaderJustificativa**: string (obrigatório para avaliação de líder)

Você pode enviar apenas mentor, apenas líder, ambos, ou múltiplos objetos.

### 6. `referencias` (array de objetos)

Referências de outros colaboradores.

```json
"referencias": [
  {
    "colaboradorId": "5",
    "tagIds": [1, 2, 5],
    "justificativa": "Justifique sua escolha"
  }
]
```

- **colaboradorId**: string (ID do colaborador referenciado)
- **tagIds**: array de numbers (IDs das tags associadas à referência)
- **justificativa**: string

---

## Exemplos de Uso

### 1. Apenas Autoavaliação

```json
{
    "ciclo": "2025.1",
    "colaboradorId": "1",
    "autoavaliacao": {
        "pilares": [
            {
                "pilarId": "10",
                "criterios": [{ "criterioId": "1", "nota": 8, "justificativa": "Bom desempenho" }]
            }
        ]
    },
    "avaliacao360": [],
    "mentoring": [],
    "referencias": []
}
```

### 2. Apenas Peer 360

```json
{
    "ciclo": "2025.1",
    "colaboradorId": "1",
    "autoavaliacao": { "pilares": [] },
    "avaliacao360": [
        {
            "avaliadoId": "2",
            "justificativa": "Colaborou muito bem"
        }
    ],
    "mentoring": [],
    "referencias": []
}
```

### 3. Mentor e Líder juntos

```json
{
    "ciclo": "2025.1",
    "colaboradorId": "1",
    "autoavaliacao": { "pilares": [] },
    "avaliacao360": [],
    "mentoring": [
        {
            "mentorId": "3",
            "justificativa": "Ótimo mentor",
            "leaderId": "4",
            "leaderJustificativa": "Líder inspirador"
        }
    ],
    "referencias": []
}
```

### 4. Referências

```json
{
    "ciclo": "2025.1",
    "colaboradorId": "1",
    "autoavaliacao": { "pilares": [] },
    "avaliacao360": [],
    "mentoring": [],
    "referencias": [
        {
            "colaboradorId": "5",
            "tagIds": [1, 2],
            "justificativa": "Referência técnica"
        }
    ]
}
```

---

## Como Funciona Internamente

1. **Validação**: O backend valida todos os campos obrigatórios e tipos.
2. **Processamento**:
    - **Autoavaliação**: Cria uma avaliação do tipo `AUTOEVALUATION` e associa os critérios.
    - **Peer 360**: Cria avaliações do tipo `PEER_360` para cada objeto.
    - **Mentoring**: Para cada objeto, cria avaliação do tipo `MENTOR` e/ou `LEADER` conforme os campos presentes.
    - **Referências**: Cria registros de referência para cada objeto.
3. **Armazenamento**: Cada avaliação é salva na tabela `Evaluation` com o tipo correspondente.

---

## Vantagens

- ✅ **Flexibilidade**: Envie qualquer combinação de avaliações em um único request.
- ✅ **Simplicidade**: Estrutura única e clara para o frontend.
- ✅ **Compatibilidade**: Mantém compatibilidade com o sistema legado.
- ✅ **Escalabilidade**: Suporta múltiplas avaliações e referências.

---

## Implementação no Frontend

Na página de avaliação, o frontend pode montar o JSON conforme as seções exibidas ao usuário. Veja exemplos de como montar o campo `mentoring` para mentor e líder:

```javascript
// Seção de Avaliação do Mentor
const mentorEvaluation = {
    mentorId: selectedMentorId,
    justificativa: mentorJustification,
};

// Seção de Avaliação do Líder
const leaderEvaluation = {
    leaderId: selectedLeaderId,
    leaderJustificativa: leaderJustification,
};

// Enviar tudo junto
const mentoringData = [
    {
        ...mentorEvaluation,
        ...leaderEvaluation,
    },
];
```

---

## Observações

- Todos os IDs devem ser enviados como string.
- Campos opcionais podem ser omitidos se não forem usados.
- O backend ignora avaliações vazias ou incompletas.

---

## Dúvidas?

Consulte este documento sempre que precisar entender ou integrar o endpoint de avaliações!
