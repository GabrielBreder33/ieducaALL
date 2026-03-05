import { useState, useEffect, useRef } from 'react';
import type { User } from '../../types';
import Modal from '../Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ProfileMenuProps {
  user: User;
  darkMode: boolean;
  onLogout: () => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

export default function ProfileMenu({ user, darkMode, onLogout, onUpdateUser }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estado do formulário de edição
  const [formData, setFormData] = useState({
    nome: user.nome,
    email: user.email,
    telefone: user.telefone,
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
    foto: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEditProfile = () => {
    setIsOpen(false);
    setIsEditModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar telefone
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    // Senha atual é SEMPRE obrigatória para aluno atualizar perfil
    if (!formData.senhaAtual) {
      newErrors.senhaAtual = 'Senha atual é obrigatória para atualizar o perfil';
    } else if (formData.senhaAtual.length < 6) {
      newErrors.senhaAtual = 'Senha deve ter no mínimo 6 caracteres';
    }

    // Validar nova senha (apenas se estiver tentando alterar)
    if (formData.novaSenha || formData.confirmarSenha) {
      if (formData.novaSenha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não coincidem';
      }
      if (formData.novaSenha && formData.novaSenha.length < 6) {
        newErrors.novaSenha = 'A nova senha deve ter no mínimo 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const requestBody: any = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        senhaAtual: formData.senhaAtual
      };

      // Só incluir nova senha se foi fornecida
      if (formData.novaSenha) {
        requestBody.novaSenha = formData.novaSenha;
      }

      const response = await fetch(`${API_URL}/User/me/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao atualizar perfil');
      }

      const updatedUser = await response.json();
      
      // Atualizar o usuário no contexto pai
      onUpdateUser(updatedUser);
      
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccessMessage('');
        setFormData({
          ...formData,
          senhaAtual: '',
          novaSenha: '',
          confirmarSenha: ''
        });
        setErrors({});
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-transform"
        >
          {user.nome.charAt(0).toUpperCase()}
        </div>

        {isOpen && (
          <div className={`absolute right-0 mt-2 w-72 rounded-lg shadow-2xl border overflow-hidden transition-colors z-50 ${
            darkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            {/* Cabeçalho do Perfil */}
            <div className={`px-4 py-4 border-b ${
              darkMode ? 'border-slate-700 bg-slate-700/50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${
                    darkMode ? 'text-slate-100' : 'text-slate-800'
                  }`}>
                    {user.nome}
                  </p>
                  <p className={`text-xs truncate ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu de Opções */}
            <div className="py-2">
              <button
                onClick={handleEditProfile}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                  darkMode 
                    ? 'hover:bg-slate-700 text-slate-200' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xl">✏️</span>
                <span className="font-medium">Editar Perfil</span>
              </button>

              <div className={`my-2 border-t ${
                darkMode ? 'border-slate-700' : 'border-slate-200'
              }`}></div>

              <button
                onClick={onLogout}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors text-red-500 hover:bg-red-50 ${
                  darkMode && 'hover:bg-red-900/20'
                }`}
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edição de Perfil */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="relative">
          <button
            onClick={() => {
              setIsEditModalOpen(false);
              setErrors({});
            }}
            className={`absolute top-4 right-4 text-2xl font-bold transition-colors z-10 ${
              darkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ×
          </button>
          <div className={`p-6 ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              darkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>
              <span>✏️</span> Editar Perfil
            </h2>

            {/* Mensagens de erro e sucesso */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {errors.general}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">{/* Foto de Perfil */}

            {/* Nome */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                    : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                } focus:outline-none ${errors.nome ? 'border-red-500' : ''}`}
                placeholder="Digite seu nome completo"
              />
              {errors.nome && (
                <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                    : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                } focus:outline-none ${errors.email ? 'border-red-500' : ''}`}
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                    : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                } focus:outline-none ${errors.telefone ? 'border-red-500' : ''}`}
                placeholder="(00) 00000-0000"
              />
              {errors.telefone && (
                <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>
              )}
            </div>

            {/* Seção de Alteração de Senha */}
            <div className={`pt-4 border-t ${
              darkMode ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className={`mb-4 p-3 rounded-lg ${
                darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}>
                <p className="text-sm">
                  ℹ️ <strong>Por segurança</strong>, é necessário informar sua senha atual para atualizar qualquer informação do perfil.
                </p>
              </div>
              
              <h3 className={`text-lg font-semibold mb-3 ${
                darkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                Autenticação & Senha
              </h3>

              {/* Senha Atual */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Senha Atual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSenhaAtual ? "text" : "password"}
                    value={formData.senhaAtual}
                    onChange={(e) => setFormData({ ...formData, senhaAtual: e.target.value })}
                    className={`w-full px-4 py-2 pr-11 rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                        : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                    } focus:outline-none ${errors.senhaAtual ? 'border-red-500' : ''}`}
                    placeholder="Digite sua senha atual (obrigatório)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                      darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    aria-label={showSenhaAtual ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showSenhaAtual ? (
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
                {errors.senhaAtual && (
                  <p className="text-red-500 text-xs mt-1">{errors.senhaAtual}</p>
                )}
              </div>

              {/* Nova Senha */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Nova Senha <span className="text-slate-400">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showNovaSenha ? "text" : "password"}
                    value={formData.novaSenha}
                    onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                    className={`w-full px-4 py-2 pr-11 rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                        : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                    } focus:outline-none ${errors.novaSenha ? 'border-red-500' : ''}`}
                    placeholder="Digite sua nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNovaSenha(!showNovaSenha)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                      darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    aria-label={showNovaSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showNovaSenha ? (
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
                {errors.novaSenha && (
                  <p className="text-red-500 text-xs mt-1">{errors.novaSenha}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Confirmar Nova Senha <span className="text-slate-400">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmarSenha ? "text" : "password"}
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                    className={`w-full px-4 py-2 pr-11 rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                        : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                    } focus:outline-none ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                    placeholder="Confirme sua nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                      darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    aria-label={showConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showConfirmarSenha ? (
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
                {errors.confirmarSenha && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmarSenha}</p>
                )}
              </div>
            </div>
          </div>

            {/* Botões de Ação */}
            <div className={`flex gap-3 mt-6 pt-4 border-t ${
              darkMode ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setErrors({});
                  setSuccessMessage('');
                }}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className={`flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
