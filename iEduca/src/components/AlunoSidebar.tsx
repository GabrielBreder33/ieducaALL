import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type NavItem = {
  label: string;
  route?: string;
  matchPrefixes?: string[];
  icon: JSX.Element;
};

interface AlunoSidebarProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    route: '/aluno/estudos',
    matchPrefixes: ['/aluno/estudos'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    )
  },
  {
    label: 'Redações',
    route: '/aluno/redacao/historico',
    matchPrefixes: ['/aluno/redacao'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    )
  },
  {
    label: 'Atividades',
    route: '/aluno/atividades',
    matchPrefixes: ['/aluno/atividades', '/aluno/atividade'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    )
  },
  {
    label: 'Ranking',
    route: '/aluno/ranking',
    matchPrefixes: ['/aluno/ranking'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    )
  }
];

const baseButtonClasses = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors';

export function AlunoSidebar({ darkMode, onToggleTheme }: AlunoSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRoute = location.pathname;

  const getButtonClasses = (active: boolean) => {
    if (active) {
      return `${baseButtonClasses} bg-blue-600 text-white`;
    }

    return `${baseButtonClasses} ${darkMode
      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  const isActive = (item: NavItem) => {
    const prefixes = item.matchPrefixes?.length ? item.matchPrefixes : item.route ? [item.route] : [];
    return prefixes.some((prefix) => activeRoute.startsWith(prefix));
  };

  const handleNavigate = (item: NavItem) => {
    if (!item.route) return;
    if (activeRoute === item.route) {
      setMobileMenuOpen(false);
      return;
    }
    navigate(item.route);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Botão Hamburguer - Visível apenas em mobile */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className={`fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl transition-all ${
          darkMode
            ? 'bg-slate-800/90 text-white hover:bg-slate-700'
            : 'bg-white/90 text-slate-900 hover:bg-slate-100'
        } backdrop-blur-sm shadow-lg border ${
          darkMode ? 'border-slate-700' : 'border-slate-200'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop para Mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 border-r transition-all duration-300 flex flex-col z-50 ${
          darkMode
            ? 'bg-slate-900/95 border-slate-700/50'
            : 'bg-white/95 border-slate-200'
        } backdrop-blur-md
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:w-52
        `}
      >
        {/* Header do Sidebar */}
        <div className="p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-blue-600">IEDUCA</h1>
            </div>
            {/* Botão Fechar - Visível apenas em mobile */}
            <button
              type="button"
              onClick={closeMobileMenu}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-1.5 sm:space-y-2">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigate(item)}
                  className={getButtonClasses(active)}
                  disabled={!item.route}
                  aria-disabled={!item.route}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Botão de Tema */}
        <div className="mt-auto p-4 sm:p-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              onToggleTheme();
              closeMobileMenu();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors border-2 ${
              darkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white border-slate-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-300'
            }`}
          >
            <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
            Alternar Tema
          </button>
        </div>
      </aside>
    </>
  );
}

export default AlunoSidebar;
