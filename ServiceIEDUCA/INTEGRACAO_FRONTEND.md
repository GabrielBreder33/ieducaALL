# Guia de Integração Frontend - Sistema de Correção de Redações

## 📱 Integração com React/TypeScript

### 1. Serviço de API (redacaoService.ts)

Atualize ou crie o arquivo `src/services/redacaoService.ts`:

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/RedacaoCorrecao';

export interface CorrecaoRedacaoRequest {
  userId: number;
  atividadeExecucaoId?: number;
  tema: string;
  textoRedacao: string;
  tipoAvaliacao?: string;
}

export interface Competencia {
  numeroCompetencia: number;
  nomeCompetencia: string;
  nota: number;
  comentario: string;
  evidencias: string[];
  melhorias: string[];
}

export interface ErroGramatical {
  posicaoInicio: number;
  posicaoFim: number;
  textoOriginal: string;
  textoSugerido: string;
  explicacao: string;
  severidade: string;
}

export interface Feedbacks {
  pontosPositivos: string[];
  pontosMelhoria: string[];
  recomendacoes: string[];
}

export interface PropostaIntervencao {
  avaliacao: string;
  sugestoesConcretas: string[];
}

export interface RedacaoCorrecao {
  id: number;
  tema: string;
  textoRedacao: string;
  notaZero: boolean;
  motivoNotaZero?: string;
  notaTotal: number;
  resumoFinal: string;
  competencias: Competencia[];
  errosGramaticais: ErroGramatical[];
  feedbacks: Feedbacks;
  propostaIntervencao?: PropostaIntervencao;
  versaoReescrita?: string;
  confiancaAvaliacao: number;
  status: string;
  progresso: number;
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface RedacaoListaItem {
  id: number;
  tema: string;
  dataEnvio: Date;
  status: 'concluida' | 'processando';
  progresso: number;
  notaTotal: number;
  notaZero: boolean;
}

export interface ProgressoCorrecao {
  id: number;
  status: string;
  progresso: number;
  concluida: boolean;
}

class RedacaoService {
  async enviarRedacao(request: CorrecaoRedacaoRequest): Promise<{ id: number; message: string }> {
    const response = await axios.post(`${API_URL}/corrigir`, request);
    return response.data;
  }

  async obterProgresso(id: number): Promise<ProgressoCorrecao> {
    const response = await axios.get(`${API_URL}/${id}/progresso`);
    return response.data;
  }

  async obterCorrecao(id: number): Promise<RedacaoCorrecao> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  }

  async listarRedacoesUsuario(userId: number): Promise<RedacaoListaItem[]> {
    const response = await axios.get(`${API_URL}/usuario/${userId}`);
    return response.data;
  }

  // Função auxiliar para polling de progresso
  async aguardarConclusao(
    id: number, 
    onProgress?: (progresso: number) => void,
    intervalMs: number = 2000
  ): Promise<RedacaoCorrecao> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const progresso = await this.obterProgresso(id);
          
          if (onProgress) {
            onProgress(progresso.progresso);
          }

          if (progresso.concluida) {
            clearInterval(interval);
            const correcao = await this.obterCorrecao(id);
            resolve(correcao);
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, intervalMs);
    });
  }
}

export default new RedacaoService();
```

### 2. Hook Personalizado (useRedacaoCorrecao.ts)

Crie `src/hooks/useRedacaoCorrecao.ts`:

```typescript
import { useState, useCallback } from 'react';
import redacaoService, { 
  CorrecaoRedacaoRequest, 
  RedacaoCorrecao 
} from '../services/redacaoService';

export const useRedacaoCorrecao = () => {
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [correcao, setCorrecao] = useState<RedacaoCorrecao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const enviarEAguardar = useCallback(async (request: CorrecaoRedacaoRequest) => {
    setLoading(true);
    setProgresso(0);
    setErro(null);
    setCorrecao(null);

    try {
      const { id } = await redacaoService.enviarRedacao(request);
      
      const resultado = await redacaoService.aguardarConclusao(
        id,
        (prog) => setProgresso(prog)
      );

      setCorrecao(resultado);
      return resultado;
    } catch (error: any) {
      setErro(error.message || 'Erro ao processar redação');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarCorrecao = useCallback(async (id: number) => {
    setLoading(true);
    setErro(null);

    try {
      const resultado = await redacaoService.obterCorrecao(id);
      setCorrecao(resultado);
      setProgresso(resultado.progresso);
      return resultado;
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar correção');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    progresso,
    correcao,
    erro,
    enviarEAguardar,
    carregarCorrecao
  };
};
```

### 3. Componente de Exemplo

```typescript
import React, { useState } from 'react';
import { useRedacaoCorrecao } from '../hooks/useRedacaoCorrecao';

export const RedacaoForm: React.FC = () => {
  const [tema, setTema] = useState('');
  const [texto, setTexto] = useState('');
  const { loading, progresso, correcao, erro, enviarEAguardar } = useRedacaoCorrecao();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await enviarEAguardar({
        userId: 1, // Obter do contexto de autenticação
        tema,
        textoRedacao: texto,
        tipoAvaliacao: 'ENEM'
      });
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Correção de Redação</h1>

      {!correcao && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-2">Tema</label>
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Texto da Redação</label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="w-full border rounded p-2 h-64"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Enviar para Correção'}
          </button>
        </form>
      )}

      {loading && (
        <div className="mt-6">
          <div className="mb-2">Processando: {progresso}%</div>
          <div className="w-full bg-gray-200 rounded">
            <div 
              className="bg-blue-600 h-4 rounded transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {erro && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
          {erro}
        </div>
      )}

      {correcao && (
        <div className="mt-6 space-y-6">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Resultado da Correção</h2>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-blue-600">
                {correcao.notaTotal}
              </span>
              <span className="text-gray-600 ml-2">/ 1000 pontos</span>
            </div>

            {correcao.notaZero && (
              <div className="bg-red-100 p-4 rounded mb-4">
                <strong>Nota Zero:</strong> {correcao.motivoNotaZero}
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-bold mb-2">Resumo</h3>
              <p className="text-gray-700">{correcao.resumoFinal}</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold">Competências</h3>
              {correcao.competencias.map((comp) => (
                <div key={comp.numeroCompetencia} className="border p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">
                      Competência {comp.numeroCompetencia}: {comp.nomeCompetencia}
                    </h4>
                    <span className="font-bold text-blue-600">
                      {comp.nota}/200
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{comp.comentario}</p>
                  
                  {comp.evidencias.length > 0 && (
                    <div className="mb-2">
                      <strong className="text-sm">Evidências:</strong>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {comp.evidencias.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {comp.melhorias.length > 0 && (
                    <div>
                      <strong className="text-sm">Melhorias:</strong>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {comp.melhorias.map((mel, i) => (
                          <li key={i}>{mel}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {correcao.errosGramaticais.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold mb-2">Erros Gramaticais</h3>
                {correcao.errosGramaticais.map((erro, i) => (
                  <div key={i} className="border-l-4 border-red-500 pl-4 mb-3">
                    <div className="text-sm">
                      <span className="line-through text-red-600">{erro.textoOriginal}</span>
                      {' → '}
                      <span className="text-green-600">{erro.textoSugerido}</span>
                    </div>
                    <p className="text-sm text-gray-600">{erro.explicacao}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div>
                <h3 className="font-bold text-green-600 mb-2">Pontos Positivos</h3>
                <ul className="list-disc list-inside text-sm">
                  {correcao.feedbacks.pontosPositivos.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-orange-600 mb-2">Pontos de Melhoria</h3>
                <ul className="list-disc list-inside text-sm">
                  {correcao.feedbacks.pontosMelhoria.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-blue-600 mb-2">Recomendações</h3>
                <ul className="list-disc list-inside text-sm">
                  {correcao.feedbacks.recomendacoes.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {correcao.versaoReescrita && (
              <div className="mt-6">
                <h3 className="font-bold mb-2">Versão Reescrita</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="whitespace-pre-wrap">{correcao.versaoReescrita}</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            Enviar Nova Redação
          </button>
        </div>
      )}
    </div>
  );
};
```

### 4. SSE (Server-Sent Events) - Alternativa para Progresso em Tempo Real

Se preferir usar SSE em vez de polling, adicione este endpoint no controller:

```csharp
[HttpGet("{id}/progresso/stream")]
public async IAsyncEnumerable<string> StreamProgresso(int id)
{
    while (true)
    {
        var correcao = await _context.RedacaoCorrecoes.FindAsync(id);
        if (correcao == null) yield break;

        yield return JsonSerializer.Serialize(new
        {
            progresso = correcao.Progresso,
            status = correcao.Status
        });

        if (correcao.Progresso >= 100) yield break;

        await Task.Delay(1000);
    }
}
```

E no frontend:

```typescript
const eventSource = new EventSource(`${API_URL}/${id}/progresso/stream`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setProgresso(data.progresso);
  
  if (data.progresso >= 100) {
    eventSource.close();
  }
};
```

## 📋 Checklist de Integração

- [ ] Atualizar `redacaoService.ts` com os novos tipos
- [ ] Criar hook `useRedacaoCorrecao.ts`
- [ ] Atualizar componente de redação
- [ ] Testar envio de redação
- [ ] Testar polling de progresso
- [ ] Implementar visualização de resultados
- [ ] Adicionar tratamento de erros
- [ ] Testar com diferentes tipos de redação
- [ ] Otimizar UX durante processamento
- [ ] Adicionar feedback visual adequado

---

**Pronto para usar!** 🚀
