import React, { useState } from 'react';
import { 
  AtividadeGerada, 
  QuestaoMultiplaEscolha,
  QuestaoDiscursiva,
  RespostaAluno,
  ResultadoAtividade,
  ResultadoCorrecao
} from '../types/atividade';

interface ExibicaoAtividadeProps {
  atividade: AtividadeGerada;
  onSubmeterRespostas: (respostas: RespostaAluno[]) => void;
  carregando?: boolean;
}

export const ExibicaoAtividadeComponent: React.FC<ExibicaoAtividadeProps> = ({ 
  atividade, 
  onSubmeterRespostas,
  carregando = false 
}) => {
  const [respostas, setRespostas] = useState<Record<number, string>>({});

  const isMultiplaEscolha = (questao: any): questao is QuestaoMultiplaEscolha => {
    return questao.alternativas && 
           Array.isArray(questao.alternativas) && 
           questao.alternativas.length > 0;
  };

  const handleRespostaChange = (numeroQuestao: number, resposta: string) => {
    setRespostas(prev => ({
      ...prev,
      [numeroQuestao]: resposta
    }));
  };

  const handleSubmit = () => {
    const respostasArray: RespostaAluno[] = Object.entries(respostas).map(([questao, resposta]) => ({
      questao: parseInt(questao),
      resposta
    }));

    if (respostasArray.length !== atividade.questoes.length) {
      alert('Por favor, responda todas as questões antes de enviar.');
      return;
    }

    onSubmeterRespostas(respostasArray);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Cabeçalho */}
      <div className="mb-6 pb-4 border-b-2 border-gray-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          📚 {atividade.configuracao.materia} - {atividade.configuracao.conteudo}
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="px-3 py-1 bg-blue-100 rounded-full">
            {atividade.configuracao.segmento}
          </span>
          <span className="px-3 py-1 bg-green-100 rounded-full">
            {atividade.configuracao.ano}
          </span>
          <span className="px-3 py-1 bg-purple-100 rounded-full">
            Nível: {atividade.configuracao.nivel}
          </span>
          <span className="px-3 py-1 bg-orange-100 rounded-full">
            {atividade.questoes.length} questões
          </span>
        </div>
      </div>

      {/* Questões */}
      <div className="space-y-6">
        {atividade.questoes.map((questao) => {
          const eMultiplaEscolha = isMultiplaEscolha(questao);
          
          return (
            <div key={questao.numero} className="p-5 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all">
              {/* Cabeçalho da questão com badge */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">
                  Questão {questao.numero}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  eMultiplaEscolha 
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-orange-100 text-orange-700 border border-orange-300'
                }`}>
                  {eMultiplaEscolha ? '🎯 Múltipla Escolha' : '📝 Discursiva'}
                </span>
              </div>
              
              <p className="text-slate-800 mb-4 leading-relaxed">
                {questao.enunciado}
              </p>

              {eMultiplaEscolha ? (
                // Múltipla escolha
                <div className="space-y-2">
                  {questao.alternativas.map((alt) => {
                    const alternativaId = alt.id || alt.letra;
                    return (
                      <label
                        key={alternativaId}
                        className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          respostas[questao.numero] === alternativaId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`questao-${questao.numero}`}
                          value={alternativaId}
                          checked={respostas[questao.numero] === alternativaId}
                          onChange={(e) => handleRespostaChange(questao.numero, e.target.value)}
                          className="mt-1 mr-3 w-4 h-4 text-blue-600"
                        />
                        <span className="flex-1 text-slate-900">
                          <strong className="mr-2">{alternativaId})</strong>
                          {alt.texto}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                // Discursiva
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Sua resposta:
                  </label>
                  <textarea
                    value={respostas[questao.numero] || ''}
                    onChange={(e) => handleRespostaChange(questao.numero, e.target.value)}
                    placeholder="Digite sua resposta aqui... Seja claro e objetivo."
                    rows={6}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-slate-900 bg-white placeholder-slate-400"
                  />
                  <p className="text-xs text-slate-500">
                    {(respostas[questao.numero] || '').length} caracteres
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão Enviar */}
      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={carregando}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
            carregando
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {carregando ? '🔄 Corrigindo...' : '✅ Enviar Respostas'}
        </button>
      </div>

      {/* Contador de respostas */}
      <div className="mt-4 text-center text-sm text-gray-600">
        {Object.keys(respostas).length} de {atividade.questoes.length} questões respondidas
      </div>
    </div>
  );
};

interface ResultadoAtividadeProps {
  resultado: ResultadoAtividade;
  atividade: AtividadeGerada;
  onNovaAtividade: () => void;
}

export const ResultadoAtividadeComponent: React.FC<ResultadoAtividadeProps> = ({ 
  resultado, 
  atividade,
  onNovaAtividade 
}) => {
  const getCorNota = (nota: number) => {
    if (nota >= 7) return 'text-green-600';
    if (nota >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusEmoji = (nota: number) => {
    if (nota >= 9) return '🏆';
    if (nota >= 7) return '😊';
    if (nota >= 5) return '😐';
    return '😢';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Cabeçalho com resultado geral */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">
          {getStatusEmoji(resultado.nota)}
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Atividade Concluída!
        </h2>
        <p className="text-slate-700 mb-6">
          {atividade.configuracao.materia} - {atividade.configuracao.conteudo}
        </p>

        {/* Card de nota */}
        <div className="inline-block p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-slate-700 mb-1">Nota Final</p>
              <p className={`text-5xl font-bold ${getCorNota(resultado.nota)}`}>
                {resultado.nota.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-700 mb-1">Aproveitamento</p>
              <p className="text-3xl font-bold text-blue-600">
                {resultado.percentual.toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <span className="text-green-600 font-semibold">
              ✅ {resultado.acertos} acertos
            </span>
            <span className="text-red-600 font-semibold">
              ❌ {resultado.erros} erros
            </span>
          </div>
        </div>
      </div>

      {/* Correção questão por questão */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          📝 Correção Detalhada
        </h3>
        {resultado.resultados.map((correcao) => (
          <div
            key={correcao.questao}
            className={`p-5 border-2 rounded-lg ${
              correcao.acertou 
                ? 'border-green-300 bg-green-50' 
                : 'border-red-300 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">
                Questão {correcao.questao}
              </h4>
              <span className={`text-2xl ${correcao.acertou ? '' : ''}`}>
                {correcao.acertou ? '✅' : '❌'}
              </span>
            </div>

            {/* Questão original */}
            <div className="mb-3">
              <p className="text-sm text-slate-700 mb-1">Enunciado:</p>
              <p className="text-slate-900">
                {atividade.questoes.find(q => q.numero === correcao.questao)?.enunciado}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Sua resposta:</p>
                <p className={`font-semibold ${correcao.acertou ? 'text-green-700' : 'text-red-700'}`}>
                  {correcao.respostaAluno}
                </p>
              </div>
              {!correcao.acertou && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Resposta correta:</p>
                  <p className="font-semibold text-green-700">
                    {correcao.respostaCorreta}
                  </p>
                </div>
              )}
            </div>

            {/* Explicação - sempre visível quando existir */}
            {correcao.explicacao && (
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>Explicação Detalhada:</span>
                </p>
                <p className="text-sm text-slate-800 leading-relaxed">{correcao.explicacao}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mensagem motivacional */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
        <h4 className="font-bold text-purple-900 mb-2">💪 Continue Praticando!</h4>
        <p className="text-slate-800 mb-4">
          {resultado.nota >= 7 
            ? 'Excelente trabalho! Você demonstrou bom domínio do conteúdo. Continue assim!'
            : resultado.nota >= 5
            ? 'Bom trabalho! Continue estudando e você vai melhorar ainda mais.'
            : 'Não desanime! O erro faz parte do aprendizado. Revise o conteúdo e tente novamente.'}
        </p>
        <button
          onClick={onNovaAtividade}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl text-lg"
        >
          ✓ Finalizar e Voltar
        </button>
      </div>
    </div>
  );
};
