import { useState } from 'react';

interface ChatCardProps {
  darkMode?: boolean;
}

export default function ChatCard({ darkMode = true }: ChatCardProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'professor',
      text: 'Olá! Sou seu professor virtual. Como posso te ajudar hoje? 📚',
      time: '10:30'
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'student',
      text: message,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Simular resposta do professor
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        sender: 'professor',
        text: 'Entendi! Vou te ajudar com isso. 🎯',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`rounded-2xl shadow-2xl backdrop-blur-sm border h-full flex flex-col transition-colors ${
      darkMode
        ? 'bg-slate-800/50 border-slate-700/50'
        : 'bg-white border-slate-200'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b transition-colors ${
        darkMode ? 'border-slate-700/50' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            P
          </div>
          <div>
            <h3 className={`text-xl font-bold ${
              darkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>Professor Virtual</h3>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'student' ? 'flex-row-reverse' : ''}`}
          >
            {msg.sender === 'professor' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                P
              </div>
            )}
            <div className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : ''}`}>
              <div
                className={`rounded-2xl px-4 py-3 max-w-xs ${
                  msg.sender === 'professor'
                    ? darkMode
                      ? 'bg-slate-700 text-slate-100'
                      : 'bg-slate-100 text-slate-800'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
              <span className={`text-xs mt-1 px-2 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-6 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className={`flex-shrink-0 px-4 py-2 text-sm rounded-lg transition-all ${
            darkMode
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}>
            📚 Explicar conceito
          </button>
          <button className={`flex-shrink-0 px-4 py-2 text-sm rounded-lg transition-all ${
            darkMode
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}>
            💡 Dicas de estudo
          </button>
          <button className={`flex-shrink-0 px-4 py-2 text-sm rounded-lg transition-all ${
            darkMode
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}>
            ✅ Resolver dúvida
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-6 border-t transition-colors ${
        darkMode ? 'border-slate-700/50' : 'border-slate-200'
      }`}>
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors ${
              darkMode
                ? 'bg-slate-700 text-slate-100 border-slate-600'
                : 'bg-white text-slate-800 border-slate-300'
            }`}
          />
          <button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all hover:scale-105 font-semibold"
          >
            📤
          </button>
        </div>
      </div>
    </div>
  );
}
