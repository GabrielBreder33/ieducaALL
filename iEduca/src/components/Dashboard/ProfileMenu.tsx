import { useState, useEffect, useRef } from 'react';
import type { User } from '../../types';
import Modal from '../Modal';

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

    // Validar senha (se estiver tentando alterar)
    if (formData.novaSenha || formData.confirmarSenha) {
      if (!formData.senhaAtual) {
        newErrors.senhaAtual = 'Informe a senha atual para alterá-la';
      }
      if (formData.novaSenha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não coincidem';
      }
      if (formData.novaSenha && formData.novaSenha.length < 6) {
        newErrors.novaSenha = 'A senha deve ter no mínimo 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = () => {
    if (!validateForm()) {
      return;
    }

    const updatedData: Partial<User> = {
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone
    };

    // Aqui você pode adicionar a lógica para atualizar a senha e a foto
    // Por enquanto, vamos apenas atualizar os dados básicos
    onUpdateUser(updatedData);
    
    setIsEditModalOpen(false);
    setFormData({
      ...formData,
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: ''
    });
    setErrors({});
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

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-700">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                {formData.nome.charAt(0).toUpperCase()}
              </div>
              <button className={`text-sm font-medium transition-colors ${
                darkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-700'
              }`}>
                Alterar Foto
              </button>
            </div>

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
              <h3 className={`text-lg font-semibold mb-3 ${
                darkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                Alterar Senha
              </h3>

              {/* Senha Atual */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={formData.senhaAtual}
                  onChange={(e) => setFormData({ ...formData, senhaAtual: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                  } focus:outline-none ${errors.senhaAtual ? 'border-red-500' : ''}`}
                  placeholder="Digite sua senha atual"
                />
                {errors.senhaAtual && (
                  <p className="text-red-500 text-xs mt-1">{errors.senhaAtual}</p>
                )}
              </div>

              {/* Nova Senha */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={formData.novaSenha}
                  onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                  } focus:outline-none ${errors.novaSenha ? 'border-red-500' : ''}`}
                  placeholder="Digite sua nova senha"
                />
                {errors.novaSenha && (
                  <p className="text-red-500 text-xs mt-1">{errors.novaSenha}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-purple-500'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500'
                  } focus:outline-none ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                  placeholder="Confirme sua nova senha"
                />
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
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
