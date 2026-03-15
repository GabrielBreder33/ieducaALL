import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { professorService } from '../../services/professorService';
import type {
  RedacaoDetalhada,
  ProfessorRedacaoRevisao,
  CompetenciaRevisaoItem,
  GrifoItem,
} from '../../services/professorService';
import type { User } from '../../types';
import TextoRedacaoGrifos from './components/TextoRedacaoGrifos';
import AvaliacaoIA from './components/AvaliacaoIA';
import FormularioRevisao from './components/FormularioRevisao';

export default function CorrigirRedacao() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const redacaoId = Number(id);

  const [professor, setProfessor] = useState<User | null>(null);
  const [darkMode] = useState(false);
  const [redacao, setRedacao] = useState<RedacaoDetalhada | null>(null);
  const [revisaoExistente, setRevisaoExistente] = useState<ProfessorRedacaoRevisao | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvandoRevisao, setSalvandoRevisao] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Form revisão
  const [notaTotal, setNotaTotal] = useState(0);
  const [comentarioGeral, setComentarioGeral] = useState('');
  const [competencias, setCompetencias] = useState<CompetenciaRevisaoItem[]>(
    [1, 2, 3, 4, 5].map(n => ({ numeroCompetencia: n, notaProfessor: 0, comentarioProfessor: '' }))
  );

  // Grifos
  const [grifos, setGrifos] = useState<GrifoItem[]>([]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'Professor') {
      navigate('/login');
      return;
    }
    setProfessor(user);

    if (!redacaoId || isNaN(redacaoId)) {
      navigate('/professor/redacoes');
      return;
    }

    carregarDados(redacaoId);
  }, [navigate, redacaoId]);

  const carregarDados = async (rId: number) => {
    setLoading(true);
    setMensagem(null);
    try {
      const [redacaoData, revisao] = await Promise.all([
        professorService.obterRedacao(rId),
        professorService.obterRevisao(rId),
      ]);
      setRedacao(redacaoData);
      setRevisaoExistente(revisao);

      // Carregar grifos existentes
      if (revisao) {
        try {
          const grifosExistentes = await professorService.obterGrifos(rId);
          setGrifos(grifosExistentes.map(g => ({
            posicaoInicio: g.posicaoInicio,
            posicaoFim: g.posicaoFim,
            cor: g.cor,
            comentario: g.comentario,
          })));
        } catch {
          setGrifos([]);
        }
      } else {
        setGrifos([]);
      }

      if (revisao) {
        setNotaTotal(revisao.notaTotalProfessor);
        setComentarioGeral(revisao.comentarioGeral || '');
        setCompetencias(
          [1, 2, 3, 4, 5].map(n => {
            const existing = revisao.competencias.find(c => c.numeroCompetencia === n);
            return {
              numeroCompetencia: n,
              notaProfessor: existing?.notaProfessor ?? 0,
              comentarioProfessor: existing?.comentarioProfessor ?? '',
            };
          })
        );
      } else {
        setNotaTotal(redacaoData.notaTotal || 0);
        setComentarioGeral('');
        setCompetencias(
          [1, 2, 3, 4, 5].map(n => {
            const iaComp = redacaoData.competencias?.find(c => c.numeroCompetencia === n);
            return {
              numeroCompetencia: n,
              notaProfessor: iaComp?.nota ?? 0,
              comentarioProfessor: '',
            };
          })
        );
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar redação' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompetenciaChange = (numero: number, field: 'notaProfessor' | 'comentarioProfessor', value: number | string) => {
    setCompetencias(prev =>
      prev.map(c =>
        c.numeroCompetencia === numero ? { ...c, [field]: value } : c
      )
    );
  };

  useEffect(() => {
    const soma = competencias.reduce((acc, c) => acc + c.notaProfessor, 0);
    setNotaTotal(soma);
  }, [competencias]);

  const handleSalvarRevisao = async () => {
    if (!professor?.id || !redacaoId) return;

    setSalvandoRevisao(true);
    setMensagem(null);
    try {
      if (revisaoExistente) {
        const revisao = await professorService.atualizarRevisao(revisaoExistente.id, professor.id, {
          notaTotalProfessor: notaTotal,
          comentarioGeral,
          competencias,
        });
        setRevisaoExistente(revisao);
      } else {
        const revisao = await professorService.criarRevisao({
          redacaoCorrecaoId: redacaoId,
          professorId: professor.id,
          notaTotalProfessor: notaTotal,
          comentarioGeral,
          competencias,
        });
        setRevisaoExistente(revisao);
      }

      // Salvar grifos
      if (grifos.length > 0) {
        await professorService.salvarGrifos(redacaoId, professor.id, grifos);
      }

      setMensagem({ tipo: 'sucesso', texto: revisaoExistente ? 'Revisão atualizada com sucesso!' : 'Revisão salva com sucesso!' });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao salvar revisão' });
    } finally {
      setSalvandoRevisao(false);
    }
  };

  if (!professor) return null;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
        Carregando redação...
      </div>
    );
  }

  if (!redacao) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
        <p className="text-lg">Redação não encontrada</p>
        <button onClick={() => navigate('/professor/redacoes')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-x-hidden w-full transition-colors ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 backdrop-blur-lg border-b transition-colors ${
        darkMode ? 'bg-slate-800/80 border-slate-700 shadow-lg' : 'bg-white/90 border-slate-300 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/professor/redacoes')} className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            ← Voltar
          </button>
          <div>
            <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {redacao.tema}
            </h1>
          </div>
        </div>
        {revisaoExistente && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Revisada</span>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto p-3 sm:p-5">
        {mensagem && (
          <div className={`mb-4 p-4 rounded-xl font-medium ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Coluna Esquerda: Texto + Grifos + IA */}
          <div className="space-y-4">
            <TextoRedacaoGrifos
              texto={redacao.textoRedacao || 'Sem texto'}
              darkMode={darkMode}
              grifos={grifos}
              onGrifosChange={setGrifos}
            />
            <AvaliacaoIA redacao={redacao} darkMode={darkMode} />
          </div>

          {/* Coluna Direita: Formulário do Professor */}
          <div>
            <FormularioRevisao
              darkMode={darkMode}
              redacao={redacao}
              revisaoExistente={revisaoExistente}
              competencias={competencias}
              notaTotal={notaTotal}
              comentarioGeral={comentarioGeral}
              salvando={salvandoRevisao}
              onCompetenciaChange={handleCompetenciaChange}
              onComentarioGeralChange={setComentarioGeral}
              onSalvar={handleSalvarRevisao}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
