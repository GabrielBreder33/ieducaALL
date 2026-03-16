import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { professorService } from '../../services/professorService';
import type { Notificacao } from '../../services/professorService';
import { authService } from '../../services/authService';

interface NotificationDropdownProps {
  darkMode: boolean;
}

export default function NotificationDropdown({ darkMode }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user?.id) return;
    try {
      const data = await professorService.listarNotificacoes(user.id);
      setNotifications(data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll a cada 30s
    return () => clearInterval(interval);
  }, [loadNotifications]);

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

  const unreadCount = notifications.filter(n => !n.lida).length;

  const handleMarkAsRead = async (id: number) => {
    const user = authService.getCurrentUser();
    if (!user?.id) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    try { await professorService.marcarNotificacaoLida(id, user.id); } catch { /* silencioso */ }
  };

  const handleMarkAllAsRead = async () => {
    const user = authService.getCurrentUser();
    if (!user?.id) return;
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    try { await professorService.marcarTodasLidas(user.id); } catch { /* silencioso */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all ${
          darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
        }`}
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-2xl border overflow-hidden transition-colors z-50 ${
          darkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          {/* Header */}
          <div className={`px-4 py-3 border-b flex justify-between items-center ${
            darkMode ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <h3 className={`font-semibold ${
              darkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>
              Notificações
            </h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-5xl mb-2">📭</div>
                <p className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Sem novidades por aqui!
                </p>
                <p className={`text-xs mt-1 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Você está em dia com tudo
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    handleMarkAsRead(notification.id);
                    if (notification.referenciaId) {
                      if (notification.tipo === 'redacao') {
                        navigate(`/aluno/redacao/${notification.referenciaId}`);
                      } else if (notification.tipo === 'atividade') {
                        navigate('/aluno/atividades');
                      }
                      setIsOpen(false);
                    }
                  }}
                  className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                    darkMode 
                      ? 'border-slate-700 hover:bg-slate-700/50' 
                      : 'border-slate-100 hover:bg-slate-50'
                  } ${
                    !notification.lida 
                      ? darkMode ? 'bg-slate-700/30' : 'bg-blue-50' 
                      : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {!notification.lida && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${
                        darkMode ? 'text-slate-200' : 'text-slate-800'
                      } ${!notification.lida ? 'font-medium' : ''}`}>
                        {notification.mensagem}
                      </p>
                      <p className={`text-xs mt-1 ${
                        darkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {new Date(notification.criadoEm).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
