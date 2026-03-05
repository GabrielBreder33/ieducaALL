import { useState } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  

  // return (
  //   <div className="fixed bottom-6 right-6 z-50">
  //     {isOpen && (
  //       <div className="mb-4 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-4 w-80">
  //         <div className="flex justify-between items-center mb-4">
  //           <h3 className="text-slate-100 font-semibold">Professor Virtual</h3>
  //           <button
  //             onClick={() => setIsOpen(false)}
  //             className="text-slate-400 hover:text-slate-100"
  //           >
  //             ✕
  //           </button>
  //         </div>

  //         <div className="bg-slate-900/50 rounded-lg p-4 mb-4 h-64 overflow-y-auto">
  //           <div className="flex gap-3 mb-4">
  //             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
  //               P
  //             </div>
  //             <div className="flex-1 bg-slate-700 rounded-lg p-3">
  //               <p className="text-slate-100 text-sm">
  //                 Olá! Sou seu professor virtual. Como posso te ajudar hoje? 📚
  //               </p>
  //             </div>
  //           </div>
  //         </div>

  //         <div className="flex gap-2">
  //           <input
  //             type="text"
  //             value={message}
  //             onChange={(e) => setMessage(e.target.value)}
  //             placeholder="Digite sua mensagem..."
  //             className="flex-1 bg-slate-700 text-slate-100 px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-purple-500"
  //           />
  //           <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
  //             📤
  //           </button>
  //         </div>
  //       </div>
  //     )}

  //     <div className="flex flex-col items-end gap-2">
  //       {isOpen && (
  //         <div className="bg-white rounded-2xl shadow-xl p-3 grid grid-cols-4 gap-2">
  //         </div>
  //       )}

  //       <button
  //         onClick={() => setIsOpen(!isOpen)}
  //         className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center text-2xl shadow-2xl hover:scale-110 transition-transform"
  //       >
  //         {isOpen ? '✕' : '💬'}
  //       </button>
  //     </div>
  //   </div>
  // );
}
