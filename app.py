import os
from flask import Flask, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
import time
from flask_cors import CORS
import re
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise EnvironmentError("A variável de ambiente GEMINI_API_KEY não está definida.")

genai.configure(api_key=GEMINI_API_KEY)

try:
    model = genai.GenerativeModel('models/gemini-1.5-flash')
except Exception as e:
    raise RuntimeError(f"Erro ao inicializar o modelo Gemini: {str(e)}")

mentor = [
    {
        "nome": "Miguel Barbosa"
    }
]

colaboradores = [
    {
        "id": "colab-001",
        "nome": "Colaborador 1",
    },
    {
        "id": "colab-002",
        "nome": "Colaborador Lorenzo",
    },
    {
        "id": "colab-003",
        "nome": "Colaborador 3",
    },
    {
        "id": "colab-004",
        "nome": "Colaborador 4",
    },
    {
        "id": "colab-005",
        "nome": "Colaborador 5",
    },
]

criterios = {
    "gestaoLideranca": {
        "id": "12",
        "titulo": "Gestão e Liderança",
        "criterios": [
            {
                "id": "gente",
                "nome": "Gente",
                "descricao": "Desenvolve, motiva e orienta pessoas para alcançar seu potencial",
            },
            {
                "id": "criativa",
                "nome": "Mente criativa",
                "descricao": "Busca soluções inovadoras e criativas para problemas",
            },
        ],
    },
    "teste": {
        "id": "13",
        "titulo": "Sentimento de dono",
        "criterios": [
            {
                "id": "pensamento",
                "nome": "Pensamento empreendedor",
                "descricao": "Gosta de negócios",
            },
            {
                "id": "crescimento",
                "nome": "Crescimento da empresa",
                "descricao": "Busca crescimento e desenvolvimento da empresa",
            },
        ],
    },
}

def gerar_resumo(texto: str) -> str:
    colaboradores_json = json.dumps(colaboradores, ensure_ascii=False)
    criterios_json = json.dumps(criterios, ensure_ascii=False)
    mentor_json = json.dumps(mentor, ensure_ascii=False)
    prompt = (
    """
    Você é um especialista em avaliação de desempenho com foco em análise comportamental baseada em evidências reais. Sua função é gerar avaliações automáticas e responsáveis a partir das anotações do cotidiano de um colaborador.

    [SISTEMAS DE AVALIAÇÃO]
    No nosso sistema de avaliação, cada colaborador possui quatro seções de avaliação:

    1. Autoavaliação (selfAssessment):
    Composta por pilares (como “Gestão e Liderança”) que contêm critérios (como “Sentimento de dono”). O colaborador atribui uma nota de 1 a 5 e fornece uma justificativa para cada critério.

    2. Avaliação 360 (evaluation360):
    O colaborador seleciona colegas com quem trabalha e avalia cada um com:
    - Uma nota geral de 1 a 5
    - Pontos fortes
    - Pontos de melhoria

    3. Mentoring:
    O colaborador avalia o próprio mentor com uma nota de 1 a 5 e uma justificativa.

    4. Referências (references):
    Ele pode indicar colegas como referência e justificar sua escolha.
    Se nas anotações algum colaborador for citado de forma clara como excelente em algum aspecto técnico ou cultural, considere incluir essa pessoa como referência na seção references, justificando o motivo.

    [O QUE VOCÊ TERÁ ACESSO]
    Você receberá os seguintes dados:
    • A lista de pilares e critérios da autoavaliação, com seus respectivos pillarId e criteriaId
    • A lista de colaboradores que trabalham com essa pessoa com nome e id
    • Nome do mentor
    • Um texto contínuo contendo anotações do dia a dia desse colaborador, que refletem seu comportamento, interações e desempenho ao longo do tempo

    [SUA FUNÇÃO]
    Sua tarefa é ler cuidadosamente essas anotações e, com base apenas no que está presente no texto, preencher as seções de avaliação somente se houver informação suficiente.

    [CRITÉRIOS DE QUALIDADE]
    • Justificativas específicas, personalizadas e bem contextualizadas têm mais valor que frases genéricas ou padronizadas.
    • Evite repetir ideias ou expressões entre os campos. Use vocabulário variado.
    • Prefira uma escrita natural e fluida, como se estivesse sendo escrita por um ser humano em primeira pessoa.
    • Em vez de copiar frases do texto original, use as informações para gerar insights originais que expressem o mesmo conteúdo de outra forma.

    [FORMATO DA RESPOSTA]
    Responda SEMPRE no seguinte formato estruturado:

    Se nenhuma informação útil for encontrada nas anotações, responda com: {"code": "NO_INSIGHT"}

    Se as anotações permitirem preencher qualquer uma das seções, responda com um JSON exatamente neste formato:
    {"selfAssessment":[],"evaluation360":[],"mentoring":null,"references":[]}

    Preencha cada seção SOMENTE se houver informação suficiente. Caso não seja possível extrair dados de uma seção, envie:
    - Um array vazio para selfAssessment, evaluation360 ou references
    - null para mentoring

    ATENÇÃO:
    • Em selfAssessment, evaluation360 e references, NUNCA coloque null em nenhum campo ou item. Sempre utilize arrays vazias quando não houver dados.
    • Em cada item de selfAssessment, evaluation360 e references, todos os campos devem ser preenchidos com strings ou números válidos. NUNCA coloque null em nenhum campo desses itens.
    • Em evaluation360, se não houver pontos fortes ou pontos de melhoria, passe uma string vazia "" no campo correspondente.
    • O único local permitido para null é o campo mentoring, quando não houver nada para avaliar sobre o mentor.
    • IMPORTANTE: O campo rating em todos os lugares deve ser sempre um número inteiro (sem aspas), nunca string.

    Exemplo de resposta completa:
    {"selfAssessment":[{"pillarId":"12","criteriaId":"gente","rating":4,"justification":"Tenho conseguido apoiar e guiar os colegas nas atividades do time, principalmente em momentos mais desafiadores."}],"evaluation360":[{"collaboratorId":"colab-001","rating":4,"strengths":"Ele tem um olhar criativo que contribui muito no início dos projetos","improvements":"Às vezes poderia ser mais ágil nas entregas"}],"mentoring":{"rating":5,"justification":"Miguel sempre me ajuda a enxergar o cenário com mais clareza quando estou diante de uma decisão difícil."},"references":[{"collaboratorId":"colab-001","justification":"Ele tem um perfil técnico muito forte e sempre traz soluções práticas e bem embasadas."}]}

    [DIRETRIZES IMPORTANTES]
    • Seja imparcial e baseie-se apenas nas evidências fornecidas
    • Considere o contexto humano por trás dos números
    • Mantenha foco na justiça e equidade do processo
    • Use linguagem profissional, humana e construtiva
    • NÃO invente informações apenas para preencher as seções
    • Se não houver conteúdo suficiente para avaliar um critério ou seção, simplesmente ignore
    • Avalie apenas o que pode ser inferido com clareza ou evidência forte
    • Dê prioridade a comportamentos observáveis, atitudes, contribuições e relacionamentos evidentes no texto

    [COLABORADORES]
    """ + colaboradores_json + """
    [CRITERIOS]
    """ + criterios_json + """
    [MENTOR]
    """ + mentor_json + """
    [TEXTO]
    """ + texto + """
    """
)

    response = model.generate_content(prompt)
    resposta = response.text.strip()
    resposta = re.sub(r'^```[a-zA-Z]*\n', '', resposta)  # Remove delimitadores no início
    resposta = re.sub(r'```$', '', resposta)  # Remove delimitadores no final
    resposta = resposta.strip()
    return resposta

def is_valid_no_insight_response(data):
    return isinstance(data, dict) and data.get('code') == 'NO_INSIGHT'

def is_valid_self_assessment_item(item):
    if not isinstance(item, dict):
        return False
    return (
        isinstance(item.get('criteriaId'), str) and item.get('criteriaId').strip() and
        isinstance(item.get('pillarId'), str) and item.get('pillarId').strip() and
        isinstance(item.get('rating'), int) and 1 <= item.get('rating') <= 5 and
        isinstance(item.get('justification'), str) and item.get('justification').strip()
    )

def is_valid_evaluation360_item(item):
    if not isinstance(item, dict):
        return False
    strengths = item.get('strengths')
    improvements = item.get('improvements')
    return (
        isinstance(item.get('collaboratorId'), str) and item.get('collaboratorId').strip() and
        isinstance(item.get('rating'), int) and 1 <= item.get('rating') <= 5 and
        isinstance(strengths, str) and isinstance(improvements, str)
    )

def is_valid_mentoring_item(item):
    if not isinstance(item, dict):
        return False
    return (
        isinstance(item.get('rating'), int) and 1 <= item.get('rating') <= 5 and
        isinstance(item.get('justification'), str) and item.get('justification').strip()
    )

def is_valid_references_item(item):
    if not isinstance(item, dict):
        return False
    return (
        isinstance(item.get('collaboratorId'), str) and item.get('collaboratorId').strip() and
        isinstance(item.get('justification'), str) and item.get('justification').strip()
    )

def is_valid_gemini_evaluation_response(data):
    if not isinstance(data, dict):
        return False
    return (
        (data.get('mentoring') is None or is_valid_mentoring_item(data.get('mentoring')))
        and isinstance(data.get('references'), list) and all(is_valid_references_item(i) for i in data.get('references'))
        and isinstance(data.get('evaluation360'), list) and all(is_valid_evaluation360_item(i) for i in data.get('evaluation360'))
        and isinstance(data.get('selfAssessment'), list) and all(is_valid_self_assessment_item(i) for i in data.get('selfAssessment'))
    )

@app.route('/avaliar', methods=['POST'])
def resumir():
    if not request.is_json:
        return jsonify({
            'code': 'ERROR', 
            'error': 'O corpo da requisição deve ser JSON.'
        }), 400

    data = request.get_json()
    texto = data.get('text')

    if not texto:
        return jsonify({
            'code': 'ERROR', 
            'error': 'Campo "text" é obrigatório.'
        }), 400

    try:
        resumo = gerar_resumo(texto)
        print("Resumo:\n" + resumo)
        if not resumo:
            return jsonify({
                'code': 'ERROR',
                'error': 'A resposta gerada está vazia ou inválida.',
            }), 500

        try:
            resumo_obj = json.loads(resumo)
        except json.JSONDecodeError as e:
            return jsonify({
                'code': 'ERROR',
                'error': 'Erro ao decodificar JSON',
            }), 500

        # Validação da resposta
        if is_valid_no_insight_response(resumo_obj):
            resumo_obj['code'] = 'NO_INSIGHT'
            return jsonify(resumo_obj)
        elif is_valid_gemini_evaluation_response(resumo_obj):
            resumo_obj['code'] = 'SUCCESS'
            return jsonify(resumo_obj)
        else:
            return jsonify({
                'code': 'ERROR',
                'error': 'Resposta da IA fora do padrão esperado.',
            }), 500
    except Exception as e:
        return jsonify({
            'code': 'ERROR',
            'error': 'Erro ao gerar o resumo com Gemini.',
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
