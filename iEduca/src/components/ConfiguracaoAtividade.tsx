import React, { useState, useEffect } from 'react';
import { 
  ConfiguracaoAtividade, 
  Materia, 
  Segmento, 
  AnoEscolar, 
  NivelDificuldade, 
  TipoQuestao,
  getAnosPorSegmento,
  sugestoesConteudo
} from '../types/atividade';

interface ConfiguracaoAtividadeProps {
  onGerarAtividade: (config: ConfiguracaoAtividade) => void;
  carregando?: boolean;
}

export const ConfiguracaoAtividadeComponent: React.FC<ConfiguracaoAtividadeProps> = ({ 
  onGerarAtividade, 
  carregando = false 
}) => {
  // Estado do formulário
  const [materia, setMateria] = useState<Materia>('Matemática');
  const [segmento, setSegmento] = useState<Segmento>('Fundamental II');
  const [ano, setAno] = useState<AnoEscolar>('6º ano');
  const [conteudo, setConteudo] = useState('');
  const [nivel, setNivel] = useState<NivelDificuldade>('Médio');
  const [quantidade, setQuantidade] = useState<5 | 10 | 15>(10);
  const [explicacao, setExplicacao] = useState(true);
  const tipo: TipoQuestao = 'MultiplaEscolha'; // FIXO: Apenas múltipla escolha

  // Controle de autocomplete
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [sugestoesFiltradas, setSugestoesFiltradas] = useState<string[]>([]);

  // Atualiza anos disponíveis quando segmento muda
  useEffect(() => {
    const anosDisponiveis = getAnosPorSegmento(segmento);
    if (anosDisponiveis.length > 0) {
      setAno(anosDisponiveis[0]);
    }
  }, [segmento]);

  // Filtra sugestões de conteúdo
  useEffect(() => {
    if (conteudo.length > 0) {
      const filtradas = sugestoesConteudo[materia].filter(s => 
        s.toLowerCase().includes(conteudo.toLowerCase())
      );
      setSugestoesFiltradas(filtradas);
    } else {
      setSugestoesFiltradas(sugestoesConteudo[materia].slice(0, 5));
    }
  }, [conteudo, materia]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conteudo.trim()) {
      alert('Por favor, informe o conteúdo da atividade');
      return;
    }

    const config: ConfiguracaoAtividade = {
      materia,
      segmento,
      ano,
      conteudo: conteudo.trim(),
      nivel,
      quantidade,
      tipo: 'MultiplaEscolha', // SEMPRE múltipla escolha
      explicacao
    };

    onGerarAtividade(config);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">
        📝 Configurar Nova Atividade
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Passo 1: Matéria */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            🔹 Passo 1: Selecione a Matéria
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['Matemática', 'Linguagens', 'Ciências da Natureza', 'Ciências Humanas'] as Materia[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMateria(m)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  materia === m 
                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold' 
                    : 'border-gray-300 hover:border-blue-300 text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Passo 2: Segmento */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            🔹 Passo 2: Selecione o Segmento
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['Fundamental I', 'Fundamental II', 'Ensino Médio', 'ENEM'] as Segmento[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSegmento(s)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  segmento === s 
                    ? 'border-green-600 bg-green-50 text-green-800 font-semibold' 
                    : 'border-gray-300 hover:border-green-300 text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Passo 3: Ano */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            🔹 Passo 3: Selecione o Ano/Série
          </label>
          <select
            value={ano}
            onChange={(e) => setAno(e.target.value as AnoEscolar)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-slate-900 bg-white"
          >
            {getAnosPorSegmento(segmento).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Passo 4: Conteúdo */}
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            🔹 Passo 4: Informe o Conteúdo
          </label>
          <input
            type="text"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            onFocus={() => setMostrarSugestoes(true)}
            onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
            placeholder="Ex: Função do 2º grau, Interpretação de texto, Cadeia alimentar..."
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-slate-900 bg-white"
            required
          />
          
          {/* Autocomplete */}
          {mostrarSugestoes && sugestoesFiltradas.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {sugestoesFiltradas.map((sugestao, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setConteudo(sugestao);
                    setMostrarSugestoes(false);
                  }}
                  className="w-full text-left p-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 text-slate-900"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Passo 5: Configurações */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            🔹 Passo 5: Configurações da Atividade
          </h3>

          {/* Quantidade de questões */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Quantidade de questões
            </label>
            <div className="flex gap-3">
              {([5, 10, 15] as const).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantidade(q)}
                  className={`px-6 py-2 rounded-lg border-2 transition-all ${
                    quantidade === q 
                      ? 'border-blue-600 bg-blue-600 text-white font-semibold' 
                      : 'border-gray-300 hover:border-blue-300 text-slate-900'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Nível */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Nível de dificuldade
            </label>
            <div className="flex gap-3">
              {(['Fácil', 'Médio', 'Difícil'] as NivelDificuldade[]).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNivel(n)}
                  className={`px-6 py-2 rounded-lg border-2 transition-all ${
                    nivel === n 
                      ? n === 'Fácil' 
                        ? 'border-green-600 bg-green-600 text-white font-semibold'
                        : n === 'Médio'
                        ? 'border-yellow-600 bg-yellow-600 text-white font-semibold'
                        : 'border-red-600 bg-red-600 text-white font-semibold'
                      : 'border-gray-300 hover:border-blue-300 text-slate-900'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mostrar explicação */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={explicacao}
                onChange={(e) => setExplicacao(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Mostrar explicação das questões no final
              </span>
            </label>
          </div>
        </div>

        {/* Botão Gerar */}
        <button
          type="submit"
          disabled={carregando}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
            carregando 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {carregando ? '🔄 Gerando atividade...' : '🚀 Gerar Atividade com IA'}
        </button>
      </form>

      {/* Preview da configuração */}
      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📋 Resumo da Configuração:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Matéria:</strong> {materia}</p>
          <p><strong>Segmento:</strong> {segmento}</p>
          <p><strong>Ano:</strong> {ano}</p>
          <p><strong>Conteúdo:</strong> {conteudo || '(não informado)'}</p>
          <p><strong>Dificuldade:</strong> {nivel} | <strong>Questões:</strong> {quantidade} | <strong>Tipo:</strong> Múltipla Escolha</p>
        </div>
      </div>
    </div>
  );
};
