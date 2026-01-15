import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { escolaService } from '../services/escolaService';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loginType, setLoginType] = useState<'user' | 'escola'>('user');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'escola') {
        // Login como escola
        const escola = await escolaService.login(email, password);
        navigate('/escola/dashboard');
      } else {
        // Login como usuário
        const user = await authService.login(email, password);
        
        if (user.role === 'Aluno') {
          navigate('/aluno/estudos');
        } else if (user.role === 'Professor') {
          navigate('/professor/dashboard');
        } else {
          setError('Esta área está em manutenção para o seu tipo de usuário.');
          authService.logout();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senha incorreta ou usuário não encontrado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-5">
      <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl shadow-slate-200/50 border border-slate-100 animate-slide-up">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            iEduca
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Acesse sua conta
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipo de Login */}
          <div>
            <label className="block mb-3 font-semibold text-slate-700 text-sm">
              Tipo de Login
            </label>
            <div className="flex gap-3 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setLoginType('user')}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                  loginType === 'user'
                    ? 'bg-white text-indigo-600 shadow-md shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                👤 Usuário
              </button>
              <button
                type="button"
                onClick={() => setLoginType('escola')}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                  loginType === 'escola'
                    ? 'bg-white text-indigo-600 shadow-md shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🏫 Escola
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block mb-2 font-semibold text-slate-700 text-sm">
              Email
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-base transition-all focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="block mb-2 font-semibold text-slate-700 text-sm">
              Senha
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-11 pr-12 py-3.5 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-base transition-all focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Botão de Login */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-300/50 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Link de Cadastro */}
        <div className="text-center mt-6 text-slate-600 text-sm">
          {loginType === 'user' ? (
            <>
            </>
          ) : (
            <>
              Não cadastrou sua escola?{' '}
              <Link to="/cadastro" className="text-indigo-600 font-bold hover:text-purple-600 transition-colors">
                Cadastre sua escola
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
