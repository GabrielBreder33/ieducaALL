import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { User } from '../../types';
import { NotificationDropdown, ProfileMenu } from '../../components/Dashboard';
import { AlunoSidebar } from '../../components/AlunoSidebar';
import { rankingService, type RankingPeriod, type RankingResponse } from '../../services/rankingService';

const PODIUM_SLOT_ORDER = [1, 0, 2];
const PODIUM_SLOT_ACCENTS: PodiumStudent['accent'][] = ['silver', 'gold', 'bronze'];

interface PodiumStudent {
  position: number;
  name: string;
  school: string;
  summary: string;
  average: number;
  avatar: string;
  accent: 'gold' | 'silver' | 'bronze';
}

interface LeaderboardEntry {
  position: number;
  initials: string;
  name: string;
  detail: string;
  essays: number;
  progressPercent: number;
  progressLabel: string;
  progressPositive: boolean;
  average: number;
}

interface UserRankingSummary {
  position: number;
  average: number;
  essays: number;
  deltaLabel: string;
  highlight: string;
}

const periodLabels: Record<RankingPeriod, string> = {
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual'
};

const formatPlural = (value: number, singular: string, plural: string) =>
  `${value} ${value === 1 ? singular : plural}`;

const getInitials = (name: string) => {
  if (!name) return '--';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0]!.substring(0, 2).toUpperCase();
  }
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
};

const buildAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&size=160`;

const normalizePercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Atualização indisponível';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Atualização indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

export default function Ranking() {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [periodo, setPeriodo] = useState<RankingPeriod>('mensal');
  const [rankingData, setRankingData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user.idEscola) {
      setRankingData(null);
      setError('Seu usuário não está vinculado a nenhuma escola.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    rankingService
      .getRankingByEscola(user.idEscola, periodo)
      .then((data) => {
        if (!active) return;
        setRankingData(data);
      })
      .catch((err) => {
        if (!active) return;
        setRankingData(null);
        setError(err instanceof Error ? err.message : 'Erro ao carregar ranking');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user, periodo, refreshKey]);

  const alunos = rankingData?.alunos ?? [];
  const hasData = !!rankingData && alunos.length > 0;

  const podiumCards = useMemo<Array<PodiumStudent | null>>(() => {
    if (!rankingData) return [];

    const topThree = alunos.slice(0, 3);

    return PODIUM_SLOT_ORDER.map((rankIndex, slotIndex) => {
      const aluno = topThree[rankIndex];
      if (!aluno) {
        return null;
      }

      return {
        position: aluno.posicao,
        name: aluno.nome,
        school: aluno.escolaNome ?? rankingData.escolaNome ?? 'Sua escola',
        summary: `${formatPlural(aluno.totalRedacoes, 'redação enviada', 'redações enviadas')} · ${formatPlural(aluno.totalAtividades, 'atividade concluída', 'atividades concluídas')}`,
        average: Math.round(aluno.mediaFinal),
        avatar: buildAvatarUrl(aluno.nome),
        accent: PODIUM_SLOT_ACCENTS[slotIndex] ?? 'bronze'
      } satisfies PodiumStudent;
    });
  }, [alunos, rankingData]);

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    return alunos.slice(3).map((aluno) => {
      const percent = normalizePercent(aluno.mediaFinal / 10);
      return {
        position: aluno.posicao,
        initials: getInitials(aluno.nome),
        name: aluno.nome,
        detail: `${formatPlural(aluno.totalRedacoes, 'redação', 'redações')} · ${formatPlural(aluno.totalAtividades, 'atividade', 'atividades')}`,
        essays: aluno.totalRedacoes,
        progressPercent: percent,
        progressLabel: `${percent}% do objetivo`,
        progressPositive: percent >= 60,
        average: Math.round(aluno.mediaFinal)
      };
    });
  }, [alunos]);

  const userSummary = useMemo<UserRankingSummary | null>(() => {
    if (!user?.id) {
      return null;
    }

    const entry = alunos.find((aluno) => aluno.userId === user.id);
    if (!entry) {
      return null;
    }

    const distanceToPodium = Math.max(0, entry.posicao - 3);
    let highlight = 'Você está no Top 3 da escola';
    if (distanceToPodium > 0) {
      highlight = distanceToPodium === 1
        ? 'Falta 1 posição para alcançar o pódio'
        : `Faltam ${distanceToPodium} posições para alcançar o pódio`;
    }

    return {
      position: entry.posicao,
      average: Math.round(entry.mediaFinal),
      essays: entry.totalRedacoes,
      deltaLabel: formatTimestamp(entry.ultimaAtualizacao),
      highlight
    };
  }, [alunos, user?.id]);

  const handleRetry = () => setRefreshKey((prev) => prev + 1);

  if (!user) {
    return null;
  }

  const getAccentClasses = (accent: PodiumStudent['accent']) => {
    switch (accent) {
      case 'gold':
        return {
          border: 'border-yellow-300',
          badge: 'bg-yellow-400 text-yellow-900',
          glow: 'shadow-[0_20px_60px_rgba(250,204,21,0.35)]'
        };
      case 'silver':
        return {
          border: 'border-slate-200',
          badge: 'bg-slate-200 text-slate-700',
          glow: 'shadow-[0_20px_50px_rgba(148,163,184,0.35)]'
        };
      default:
        return {
          border: 'border-amber-200',
          badge: 'bg-amber-200 text-amber-800',
          glow: 'shadow-[0_20px_50px_rgba(251,191,36,0.35)]'
        };
    }
  };

  const renderProgressBar = (entry: LeaderboardEntry) => {
    const gradient = entry.progressPositive
      ? 'from-emerald-400 to-emerald-500'
      : 'from-amber-400 to-amber-500';
    const labelClass = entry.progressPositive ? 'text-emerald-600' : 'text-amber-600';

    return (
      <div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
            style={{ width: `${entry.progressPercent}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${labelClass}`}>
          {entry.progressLabel}
        </span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
      : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'
    }`}>
      <AlunoSidebar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />

      <div className="ml-52 min-h-screen flex flex-col">
        <header className={`backdrop-blur-sm px-6 py-4 border-b flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 ${darkMode
          ? 'bg-slate-800/80 border-slate-700/50'
          : 'bg-white/90 border-slate-200 shadow-sm'
        }`}>
          <div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Comparativo em tempo real</p>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ranking de Alunos</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Acompanhe sua evolução frente à elite da plataforma.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown darkMode={darkMode} />
            <ProfileMenu user={user} darkMode={darkMode} onLogout={() => { authService.logout(); navigate('/login'); }} onUpdateUser={(data) => {
              const updatedUser = { ...user, ...data } as User;
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }} />
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className={`rounded-3xl border px-4 py-3 flex flex-wrap gap-6 items-center justify-between ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div>
                <p className={`text-xs uppercase tracking-[0.4em] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Período de análise
                </p>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{periodLabels[periodo]}</p>
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.3em] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Escola
                </p>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {rankingData?.escolaNome ?? 'Sem vínculo'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(Object.keys(periodLabels) as RankingPeriod[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPeriodo(option)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${option === periodo
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                      : darkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {periodLabels[option]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleRetry}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${darkMode
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Atualizar
                </button>
              </div>
            </div>

            {loading ? (
              <div className={`rounded-3xl border p-10 text-center ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="animate-spin w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto mb-4" />
                <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Atualizando ranking...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className={`rounded-3xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${darkMode ? 'bg-rose-900/40 border-rose-700 text-rose-100' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                    <div>
                      <p className="text-lg font-semibold">Não foi possível carregar o ranking</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className={`${darkMode ? 'bg-rose-700/80 text-white hover:bg-rose-600/80' : 'bg-rose-600 text-white hover:bg-rose-700'} px-5 py-2 rounded-full font-semibold transition`}
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {!error && !hasData && (
                  <div className={`rounded-3xl border p-8 text-center ${darkMode ? 'bg-slate-900/40 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <p className="text-lg font-semibold">Ainda não há dados para este período</p>
                    <p className="text-sm mt-2">
                      Envie novas redações ou finalize atividades para entrar no ranking.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/aluno/estudos')}
                      className="mt-4 px-5 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                      Ir para meus estudos
                    </button>
                  </div>
                )}

                {!error && hasData && (
                  <>
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {podiumCards.map((student, index) => {
                        if (!student) {
                          return <div key={`podium-placeholder-${index}`} className="hidden md:block" aria-hidden="true" />;
                        }

                        const accent = getAccentClasses(student.accent);
                        return (
                          <div
                            key={student.position}
                            className={`relative rounded-3xl border-2 p-6 text-center ${darkMode ? 'bg-slate-900' : 'bg-white'} ${accent.border} ${accent.glow}`}
                          >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                              <span className={`px-4 py-1 rounded-full text-xs font-bold ${accent.badge}`}>
                                #{student.position}
                              </span>
                            </div>
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-24 h-24 rounded-full object-cover mx-auto mt-2 border-4 border-white shadow-lg"
                            />
                            <h3 className={`mt-4 text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{student.name}</h3>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {student.school}
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                              {student.summary}
                            </p>
                            <div className={`mt-5 rounded-2xl p-4 ${darkMode ? 'bg-slate-800' : 'bg-blue-50'}`}>
                              <p className={`text-xs uppercase tracking-[0.4em] font-semibold ${darkMode ? 'text-slate-400' : 'text-blue-500'}`}>
                                Média geral
                              </p>
                              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-blue-600'}`}>{student.average}</p>
                            </div>
                          </div>
                        );
                      })}
                    </section>

                    <section className={`rounded-3xl border ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200'} overflow-hidden`}>
                      <div className="grid grid-cols-12 px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                        <span className="col-span-2">Posição</span>
                        <span className="col-span-3">Estudante</span>
                        <span className="col-span-2">Redações</span>
                        <span className="col-span-3">Progresso</span>
                        <span className="col-span-2 text-right">Média final</span>
                      </div>
                      <div>
                        {leaderboard.map((entry) => (
                          <div
                            key={entry.position}
                            className={`grid grid-cols-12 items-center px-6 py-5 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-100'} ${darkMode ? 'text-white' : 'text-slate-900'}`}
                          >
                            <div className="col-span-2 flex items-center gap-3">
                              <span className="text-lg font-black text-blue-500">#{entry.position}</span>
                            </div>
                            <div className="col-span-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                                {entry.initials}
                              </div>
                              <div>
                                <p className="font-semibold">{entry.name}</p>
                                <p className="text-xs text-slate-500">{entry.detail}</p>
                              </div>
                            </div>
                            <div className="col-span-2 text-sm text-slate-500">
                              {entry.essays} enviadas
                            </div>
                            <div className="col-span-3">
                              {renderProgressBar(entry)}
                            </div>
                            <div className="col-span-2 text-right text-xl font-black">
                              {entry.average}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {userSummary ? (
                      <section className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xl">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-black">#{userSummary.position}</div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] font-semibold opacity-80">Sua posição</p>
                            <p className="text-base font-medium">{userSummary.highlight}</p>
                            <p className="text-xs opacity-80">{userSummary.deltaLabel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8 text-center">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] opacity-80">Média</p>
                            <p className="text-3xl font-black">{userSummary.average}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] opacity-80">Redações</p>
                            <p className="text-3xl font-black">{userSummary.essays}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/aluno/estudos')}
                          className="px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 transition font-semibold"
                        >
                          Ver desempenho completo →
                        </button>
                      </section>
                    ) : (
                      <section className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <p className="text-lg font-semibold">Você ainda não aparece no ranking deste período</p>
                        <p className="text-sm mt-2">
                          Complete novas atividades e redações para desbloquear sua posição.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => navigate('/aluno/estudos')}
                            className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                          >
                            Planejar estudos
                          </button>
                          <button
                            type="button"
                            onClick={handleRetry}
                            className={`px-5 py-2 rounded-full font-semibold ${darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                          >
                            Atualizar agora
                          </button>
                        </div>
                      </section>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
