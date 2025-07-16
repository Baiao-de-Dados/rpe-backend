# Integração da IA de Equalização

## Visão Geral

A IA foi integrada ao sistema de equalização para gerar automaticamente resumos detalhados baseados nas avaliações dos colaboradores. Isso ajuda o comitê a tomar decisões mais informadas.

## Funcionalidades Implementadas

### 1. Geração Manual de Resumo
- O comitê clica em um botão específico para gerar o resumo da IA
- O resumo é baseado em todas as avaliações disponíveis (autoavaliação, 360, gestor, etc.)
- O resumo gerado pode ser editado antes de salvar a equalização

### 2. Endpoint Dedicado para IA
- `POST /committee/equalization/:collaboratorId/generate-ai-summary`
- Permite gerar resumo da IA independentemente da equalização

### 3. Campo `aiSummary` no Banco
- Novo campo `aiSummary` na tabela `Equalization`
- Armazena o resumo gerado pela IA

## Endpoints Disponíveis

### 1. Salvar Equalização
```http
POST /committee/equalization
Content-Type: application/json
Authorization: Bearer <token>

{
  "cycleConfigId": 6,
  "collaboratorId": 3,
  "equalization": {
    "score": 4.5,
    "justification": "Nota final após análise de todas as avaliações do colaborador",
    "changeReason": "Revisão após feedback do manager", // opcional
    "aiSummary": "Resumo da IA (opcional, gerado pelo botão específico)" // opcional
  }
}
```

**Resposta:**
```json
{
  "message": "Equalização criada com sucesso",
  "equalization": {
    "id": 123,
    "collaboratorId": 3,
    "cycleId": 6,
    "committeeId": 5,
    "score": 4.5,
    "justification": "Nota final após análise de todas as avaliações do colaborador",
    "aiSummary": "Análise detalhada gerada pela IA sobre o desempenho do colaborador...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "committee": {
      "id": 5,
      "name": "João Silva",
      "position": "Membro do Comitê"
    }
  }
}
```

### 2. Gerar Resumo da IA
```http
POST /committee/equalization/3/generate-ai-summary?cycleConfigId=6
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "code": "SUCCESS",
  "rating": 4,
  "detailedAnalysis": "O colaborador apresentou desempenho consistente, com destaque para a colaboração técnica e entrega de resultados. Houve divergência entre autoavaliação e feedback do líder, justificada pela diferença de percepção sobre prazos.",
  "summary": "Colaborador demonstra bom desempenho geral, com pequenas divergências entre avaliações.",
  "discrepancies": "A autoavaliação foi superior ao feedback dos pares, indicando possível viés de autopercepção."
}
```

### 3. Buscar Detalhes do Colaborador (inclui aiSummary)
```http
GET /committee/collaborator/3/evaluation-details?cycleConfigId=6
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "collaborator": {
    "id": 3,
    "name": "João Silva",
    "position": "Desenvolvedor Senior",
    "email": "joao@empresa.com",
    "track": { "id": 1, "name": "Desenvolvimento" }
  },
  "cycle": {
    "id": 6,
    "name": "Ciclo 2024.2",
    "startDate": "2024-07-01",
    "endDate": "2024-12-31"
  },
  "autoEvaluation": {
    "score": 4.2,
    "criteria": [...]
  },
  "evaluation360": [...],
  "managerEvaluation": {
    "score": 4.0,
    "criteria": [...]
  },
  "committeeEqualization": {
    "finalScore": 4.3,
    "comments": "Nota final após análise do comitê",
    "aiSummary": "Análise detalhada gerada pela IA sobre o desempenho do colaborador...",
    "committee": {
      "id": 5,
      "name": "João Silva",
      "position": "Membro do Comitê"
    },
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

## Integração no Frontend

### 1. Componente de Equalização

```typescript
interface EqualizationForm {
  score: number;
  justification: string;
  changeReason?: string;
  aiSummary?: string;
}

const EqualizationForm: React.FC = () => {
  const [form, setForm] = useState<EqualizationForm>({
    score: 0,
    justification: '',
    changeReason: '',
    aiSummary: ''
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');

  // Gerar resumo da IA
  const generateAiSummary = async () => {
    setAiLoading(true);
    try {
      const response = await api.post(`/committee/equalization/${collaboratorId}/generate-ai-summary?cycleConfigId=${cycleId}`);
      
      if (response.data.code === 'SUCCESS') {
        setAiSummary(response.data.detailedAnalysis || response.data.summary || '');
        setForm(prev => ({
          ...prev,
          aiSummary: response.data.detailedAnalysis || response.data.summary || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao gerar resumo da IA:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Salvar equalização
  const saveEqualization = async () => {
    try {
      const response = await api.post('/committee/equalization', {
        cycleConfigId: cycleId,
        collaboratorId,
        equalization: form
      });
      
      // A equalização será salva com o resumo da IA (se fornecido)
      console.log('Equalização salva:', response.data);
    } catch (error) {
      console.error('Erro ao salvar equalização:', error);
    }
  };

  return (
    <div>
      <h2>Equalização do Colaborador</h2>
      
      {/* Campos básicos */}
      <div>
        <label>Nota Final:</label>
        <input
          type="number"
          min="1"
          max="5"
          step="0.1"
          value={form.score}
          onChange={(e) => setForm(prev => ({ ...prev, score: Number(e.target.value) }))}
        />
      </div>

      <div>
        <label>Justificativa:</label>
        <textarea
          value={form.justification}
          onChange={(e) => setForm(prev => ({ ...prev, justification: e.target.value }))}
        />
      </div>

      {/* Botão para gerar resumo da IA */}
      <button 
        onClick={generateAiSummary}
        disabled={aiLoading}
      >
        {aiLoading ? 'Gerando...' : 'Gerar Resumo da IA'}
      </button>

      {/* Exibir resumo da IA */}
      {aiSummary && (
        <div>
          <h3>Resumo da IA</h3>
          <p>{aiSummary}</p>
        </div>
      )}

      {/* Campo opcional para editar o resumo da IA */}
      <div>
        <label>Resumo da IA (opcional):</label>
        <textarea
          value={form.aiSummary}
          onChange={(e) => setForm(prev => ({ ...prev, aiSummary: e.target.value }))}
          placeholder="Clique em 'Gerar Resumo da IA' para preencher automaticamente"
        />
      </div>

      <button onClick={saveEqualization}>
        Salvar Equalização
      </button>
    </div>
  );
};
```

### 2. Componente de Visualização

```typescript
const CollaboratorDetails: React.FC = () => {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const response = await api.get(`/committee/collaborator/${collaboratorId}/evaluation-details?cycleConfigId=${cycleId}`);
      setDetails(response.data);
    };
    fetchDetails();
  }, [collaboratorId, cycleId]);

  return (
    <div>
      {details?.committeeEqualization?.aiSummary && (
        <div>
          <h3>Análise da IA</h3>
          <p>{details.committeeEqualization.aiSummary}</p>
        </div>
      )}
      
      {/* Outros detalhes da equalização */}
    </div>
  );
};
```

### 3. Dashboard do Comitê

```typescript
const CommitteeDashboard: React.FC = () => {
  const [collaborators, setCollaborators] = useState<any[]>([]);

  useEffect(() => {
    const fetchCollaborators = async () => {
      const response = await api.get('/committee/dashboard/collaborators-summary');
      setCollaborators(response.data);
    };
    fetchCollaborators();
  }, []);

  return (
    <div>
      <h2>Dashboard do Comitê</h2>
      
      {collaborators.map(collaborator => (
        <div key={collaborator.collaborator.id}>
          <h3>{collaborator.collaborator.name}</h3>
          <p>Status: {collaborator.status}</p>
          <p>Nota Final: {collaborator.committeeEqualization || 'Pendente'}</p>
          
          <Link to={`/committee/collaborator/${collaborator.collaborator.id}`}>
            Ver Detalhes
          </Link>
        </div>
      ))}
    </div>
  );
};
```

## Fluxo de Trabalho Recomendado

1. **Visualizar Colaboradores**: Acesse o dashboard do comitê
2. **Analisar Detalhes**: Clique em um colaborador para ver todas as avaliações
3. **Gerar Resumo da IA**: Clique no botão "Gerar Resumo da IA" para obter análise automática
4. **Revisar e Ajustar**: Edite o resumo da IA se necessário
5. **Salvar Equalização**: Salve com nota final e justificativa

## Benefícios

- **Análise Objetiva**: IA analisa todas as avaliações de forma imparcial
- **Economia de Tempo**: Geração manual de resumos detalhados sob demanda
- **Consistência**: Padrão uniforme nas análises
- **Transparência**: Resumos ficam salvos para auditoria
- **Flexibilidade**: Permite edição manual quando necessário
- **Controle**: Comitê decide quando gerar o resumo

## Tratamento de Erros

- Se a IA falhar, a equalização continua sendo salva sem o resumo
- Logs de erro são mantidos para debugging
- Interface mostra feedback claro sobre o status da geração 