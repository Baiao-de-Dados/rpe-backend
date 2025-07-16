# Integração da IA de Equalização - Frontend

## Tipos TypeScript

```typescript
// Tipos para a resposta da IA
interface AiEqualizationResponse {
  code: 'SUCCESS' | 'NO_INSIGHT' | 'ERROR';
  error?: string;
  rating?: number;
  detailedAnalysis?: string;
  summary?: string;
  discrepancies?: string;
}

// Tipo para o resumo da IA salvo no banco (JSON completo)
interface AiSummaryData {
  code: 'SUCCESS' | 'NO_INSIGHT' | 'ERROR';
  rating?: number;
  detailedAnalysis?: string;
  summary?: string;
  discrepancies?: string;
}

// Tipo para o formulário de equalização
interface EqualizationForm {
  score: number;
  justification: string;
  changeReason?: string;
  aiSummary?: AiSummaryData;
}

// Tipo para salvar equalização
interface SaveEqualizationRequest {
  cycleConfigId: number;
  collaboratorId: number;
  equalization: EqualizationForm;
}

// Tipo para resposta da equalização salva
interface EqualizationResponse {
  message: string;
  equalization: {
    id: number;
    collaboratorId: number;
    cycleId: number;
    committeeId: number;
    score: number;
    justification: string;
    aiSummary?: string;
    createdAt: string;
    updatedAt: string;
    committee: {
      id: number;
      name: string;
      position: string;
    };
  };
}
```

## Serviços/API

```typescript
// api/committee.ts
export const committeeApi = {
  // Gerar resumo da IA (salva automaticamente no banco)
  generateAiSummary: async (collaboratorId: number, cycleConfigId: number): Promise<AiEqualizationResponse> => {
    const response = await api.post(`/committee/equalization/${collaboratorId}/generate-ai-summary?cycleConfigId=${cycleConfigId}`);
    return response.data;
  },

  // Buscar resumo da IA salvo no banco
  getAiSummary: async (collaboratorId: number, cycleConfigId: number) => {
    const response = await api.get(`/committee/equalization/${collaboratorId}/ai-summary?cycleConfigId=${cycleConfigId}`);
    return response.data; // Retorna: { collaborator, cycle, aiSummary: AiSummaryData, committee, generatedAt }
  },

  // Salvar equalização
  saveEqualization: async (data: SaveEqualizationRequest): Promise<EqualizationResponse> => {
    const response = await api.post('/committee/equalization', data);
    return response.data;
  },

  // Buscar detalhes do colaborador (inclui aiSummary)
  getCollaboratorDetails: async (collaboratorId: number, cycleConfigId: number) => {
    const response = await api.get(`/committee/collaborator/${collaboratorId}/evaluation-details?cycleConfigId=${cycleConfigId}`);
    return response.data;
  },

  // Buscar equalização existente
  getEqualization: async (collaboratorId: number, cycleConfigId: number) => {
    const response = await api.get(`/committee/equalization/${collaboratorId}?cycleConfigId=${cycleConfigId}`);
    return response.data;
  }
};
```

## Lógica dos Componentes

### 1. Hook para Equalização

```typescript
// hooks/useEqualization.ts
export const useEqualization = (collaboratorId: number, cycleConfigId: number) => {
  const [form, setForm] = useState<EqualizationForm>({
    score: 0,
    justification: '',
    changeReason: '',
    aiSummary: ''
  });
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiSummaryData | null>(null);

  // Carregar resumo da IA salvo
  const loadAiSummary = async () => {
    try {
      const savedSummary = await committeeApi.getAiSummary(collaboratorId, cycleConfigId);
      if (savedSummary.aiSummary) {
        setAiSummary(savedSummary.aiSummary);
        setForm(prev => ({ ...prev, aiSummary: savedSummary.aiSummary }));
      }
    } catch (error) {
      // Resumo não encontrado, não é erro
      console.log('Nenhum resumo da IA encontrado');
    }
  };

  // Gerar novo resumo da IA
  const generateAiSummary = async () => {
    setAiLoading(true);
    try {
      const response = await committeeApi.generateAiSummary(collaboratorId, cycleConfigId);
      
      if (response.code === 'SUCCESS') {
        // Salvar toda a resposta da IA
        const aiSummaryData: AiSummaryData = {
          code: response.code,
          rating: response.rating,
          detailedAnalysis: response.detailedAnalysis,
          summary: response.summary,
          discrepancies: response.discrepancies,
        };
        setAiSummary(aiSummaryData);
        setForm(prev => ({ ...prev, aiSummary: aiSummaryData }));
      } else {
        console.error('Erro na IA:', response.error);
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Salvar equalização
  const saveEqualization = async () => {
    try {
      const response = await committeeApi.saveEqualization({
        cycleConfigId,
        collaboratorId,
        equalization: form
      });
      return response;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      throw error;
    }
  };

  return {
    form,
    setForm,
    aiLoading,
    aiSummary,
    loadAiSummary,
    generateAiSummary,
    saveEqualization
  };
};
```

### 2. Componente Principal

```typescript
// components/EqualizationForm.tsx
interface Props {
  collaboratorId: number;
  cycleConfigId: number;
}

export const EqualizationForm: React.FC<Props> = ({ collaboratorId, cycleConfigId }) => {
  const {
    form,
    setForm,
    aiLoading,
    aiSummary,
    loadAiSummary,
    generateAiSummary,
    saveEqualization
  } = useEqualization(collaboratorId, cycleConfigId);

  // Carregar resumo salvo quando o componente montar
  useEffect(() => {
    loadAiSummary();
  }, [collaboratorId, cycleConfigId]);

  const handleSubmit = async () => {
    try {
      await saveEqualization();
      // Sucesso - redirecionar ou mostrar mensagem
    } catch (error) {
      // Tratar erro
    }
  };

  return (
    <div>
      {/* Seção da IA */}
      <div className="ai-section">
        <h3>Análise da IA</h3>
        
        {aiLoading && <p>Gerando análise...</p>}
        
        {aiSummary && (
          <div className="ai-summary">
            <h4>Resumo da IA</h4>
            
            {/* Rating */}
            {aiSummary.rating && (
              <div className="ai-rating">
                <strong>Avaliação:</strong> {aiSummary.rating}/5
              </div>
            )}
            
            {/* Summary */}
            {aiSummary.summary && (
              <div className="ai-summary-text">
                <strong>Resumo:</strong>
                <p>{aiSummary.summary}</p>
              </div>
            )}
            
            {/* Detailed Analysis */}
            {aiSummary.detailedAnalysis && (
              <div className="ai-detailed-analysis">
                <strong>Análise Detalhada:</strong>
                <p>{aiSummary.detailedAnalysis}</p>
              </div>
            )}
            
            {/* Discrepancies */}
            {aiSummary.discrepancies && (
              <div className="ai-discrepancies">
                <strong>Divergências Identificadas:</strong>
                <p>{aiSummary.discrepancies}</p>
              </div>
            )}
          </div>
        )}
        
        <button 
          onClick={generateAiSummary}
          disabled={aiLoading}
          className="generate-ai-btn"
        >
          {aiLoading ? 'Gerando...' : 'Gerar Análise da IA'}
        </button>
      </div>

      {/* Formulário de Equalização */}
      <form onSubmit={handleSubmit}>
        {/* ... resto do formulário ... */}
      </form>
    </div>
  );
};

  return (
    <div>
      {/* Campos básicos */}
      <input
        type="number"
        min="1"
        max="5"
        step="0.1"
        value={form.score}
        onChange={(e) => setForm(prev => ({ ...prev, score: Number(e.target.value) }))}
        placeholder="Nota final"
      />

      <textarea
        value={form.justification}
        onChange={(e) => setForm(prev => ({ ...prev, justification: e.target.value }))}
        placeholder="Justificativa"
      />

      {/* Botão para gerar IA */}
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

      {/* Campo para editar resumo */}
      <textarea
        value={form.aiSummary}
        onChange={(e) => setForm(prev => ({ ...prev, aiSummary: e.target.value }))}
        placeholder="Resumo da IA (opcional)"
      />

      <button onClick={handleSubmit}>
        Salvar Equalização
      </button>
    </div>
  );
};
```

### 3. Componente de Detalhes

```typescript
// components/CollaboratorDetails.tsx
export const CollaboratorDetails: React.FC<Props> = ({ collaboratorId, cycleConfigId }) => {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const data = await committeeApi.getCollaboratorDetails(collaboratorId, cycleConfigId);
      setDetails(data);
    };
    fetchDetails();
  }, [collaboratorId, cycleConfigId]);

  return (
    <div>
      {/* Dados do colaborador */}
      <h2>{details?.collaborator?.name}</h2>
      
      {/* Autoavaliação */}
      {details?.autoEvaluation && (
        <div>
          <h3>Autoavaliação</h3>
          <p>Nota: {details.autoEvaluation.score}</p>
        </div>
      )}

      {/* Avaliação 360 */}
      {details?.evaluation360?.length > 0 && (
        <div>
          <h3>Avaliação 360</h3>
          {details.evaluation360.map((eval: any, index: number) => (
            <div key={index}>
              <p>{eval.collaboratorName} - {eval.rating}</p>
            </div>
          ))}
        </div>
      )}

      {/* Equalização do Comitê */}
      {details?.committeeEqualization && (
        <div>
          <h3>Equalização do Comitê</h3>
          <p>Nota Final: {details.committeeEqualization.finalScore}</p>
          <p>Comentários: {details.committeeEqualization.comments}</p>
          
          {/* Resumo da IA */}
          {details.committeeEqualization.aiSummary && (
            <div>
              <h4>Análise da IA</h4>
              <p>{details.committeeEqualization.aiSummary}</p>
            </div>
          )}
        </div>
      )}

      {/* Botão para gerar nova equalização */}
      <EqualizationForm 
        collaboratorId={collaboratorId} 
        cycleConfigId={cycleConfigId} 
      />
    </div>
  );
};
```

## Fluxo de Implementação

### 1. **Página de Lista de Colaboradores**
```typescript
// pages/CommitteeDashboard.tsx
const CommitteeDashboard = () => {
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    // Buscar lista de colaboradores
    const fetchCollaborators = async () => {
      const response = await api.get('/committee/dashboard/collaborators-summary');
      setCollaborators(response.data);
    };
    fetchCollaborators();
  }, []);

  return (
    <div>
      {collaborators.map(collaborator => (
        <div key={collaborator.collaborator.id}>
          <h3>{collaborator.collaborator.name}</h3>
          <p>Status: {collaborator.status}</p>
          <p>Nota: {collaborator.committeeEqualization || 'Pendente'}</p>
          
          <Link to={`/committee/collaborator/${collaborator.collaborator.id}`}>
            Ver Detalhes
          </Link>
        </div>
      ))}
    </div>
  );
};
```

### 2. **Página de Detalhes do Colaborador**
```typescript
// pages/CollaboratorDetails.tsx
const CollaboratorDetails = () => {
  const { collaboratorId, cycleConfigId } = useParams();
  
  return (
    <div>
      <CollaboratorDetails 
        collaboratorId={Number(collaboratorId)} 
        cycleConfigId={Number(cycleConfigId)} 
      />
    </div>
  );
};
```

## Instruções Gerais

### 1. **Estrutura de Pastas**
```
src/
├── api/
│   └── committee.ts
├── hooks/
│   └── useEqualization.ts
├── components/
│   ├── EqualizationForm.tsx
│   └── CollaboratorDetails.tsx
├── pages/
│   ├── CommitteeDashboard.tsx
│   └── CollaboratorDetails.tsx
└── types/
    └── committee.ts
```

### 2. **Fluxo de Uso**
1. Comitê acessa dashboard
2. Clica em "Ver Detalhes" de um colaborador
3. Na página de detalhes, vê todas as avaliações
4. Clica em "Gerar Resumo da IA"
5. IA analisa todas as avaliações e gera resumo
6. Comitê pode editar o resumo se necessário
7. Preenche nota final e justificativa
8. Salva equalização

### 3. **Estados Importantes**
- `aiLoading`: Controla loading do botão da IA
- `aiSummary`: Armazena resumo gerado pela IA
- `form`: Formulário da equalização
- `details`: Dados completos do colaborador

### 4. **Tratamento de Erros**
- IA pode retornar `NO_INSIGHT` se não houver dados suficientes
- IA pode retornar `ERROR` se houver problema
- Equalização salva mesmo sem resumo da IA
- Mostrar feedback visual para todos os estados

### 5. **Endpoints Principais**
- `POST /committee/equalization/:id/generate-ai-summary` - Gerar IA
- `POST /committee/equalization` - Salvar equalização
- `GET /committee/collaborator/:id/evaluation-details` - Detalhes
- `GET /committee/dashboard/collaborators-summary` - Lista

Essa estrutura permite implementar a funcionalidade de forma organizada e reutilizável! 🎯

## Como Funciona o Salvamento Completo

### 1. **Geração da IA**
Quando você chama `POST /committee/equalization/{id}/generate-ai-summary`:

```typescript
// Resposta da IA
{
  "code": "SUCCESS",
  "rating": 4,
  "detailedAnalysis": "O colaborador apresentou desempenho consistente...",
  "summary": "Colaborador demonstra bom desempenho geral...",
  "discrepancies": "A autoavaliação foi superior ao feedback dos pares..."
}
```

### 2. **Salvamento Automático**
O backend salva **TODA** a resposta da IA no banco como JSON:

```typescript
// O que é salvo no campo aiSummary (JSON)
{
  code: 'SUCCESS',
  rating: 4,
  detailedAnalysis: "O colaborador apresentou desempenho consistente...",
  summary: "Colaborador demonstra bom desempenho geral...",
  discrepancies: "A autoavaliação foi superior ao feedback dos pares..."
}
```

### 3. **Busca do Resumo Salvo**
Quando você chama `GET /committee/equalization/{id}/ai-summary`:

```typescript
// Resposta do GET
{
  collaborator: { id: 1, name: "João Silva" },
  cycle: { id: 6, name: "Ciclo 2024" },
  aiSummary: {
    code: 'SUCCESS',
    rating: 4,
    detailedAnalysis: "O colaborador apresentou desempenho consistente...",
    summary: "Colaborador demonstra bom desempenho geral...",
    discrepancies: "A autoavaliação foi superior ao feedback dos pares..."
  },
  committee: { id: 1, name: "Comitê A", position: "Membro" },
  generatedAt: "2024-01-15T10:30:00Z"
}
```

### 4. **Exibição no Frontend**
Agora você pode exibir todos os campos:

```typescript
{aiSummary && (
  <div className="ai-analysis">
    <h4>Análise da IA</h4>
    
    {/* Rating */}
    {aiSummary.rating && (
      <div>
        <strong>Avaliação:</strong> {aiSummary.rating}/5
      </div>
    )}
    
    {/* Summary */}
    {aiSummary.summary && (
      <div>
        <strong>Resumo:</strong>
        <p>{aiSummary.summary}</p>
      </div>
    )}
    
    {/* Detailed Analysis */}
    {aiSummary.detailedAnalysis && (
      <div>
        <strong>Análise Detalhada:</strong>
        <p>{aiSummary.detailedAnalysis}</p>
      </div>
    )}
    
    {/* Discrepancies */}
    {aiSummary.discrepancies && (
      <div>
        <strong>Divergências:</strong>
        <p>{aiSummary.discrepancies}</p>
      </div>
    )}
  </div>
)}
```

### 5. **Vantagens**
- ✅ **Todos os campos salvos**: `rating`, `summary`, `detailedAnalysis`, `discrepancies`
- ✅ **Persistente**: Dados ficam salvos no banco
- ✅ **Reutilizável**: Pode ser carregado em qualquer tela
- ✅ **Completo**: Mantém toda a análise da IA
- ✅ **Flexível**: Pode exibir apenas os campos que quiser

Agora o frontend tem acesso a **TODA** a análise da IA, não apenas o resumo! 🚀 