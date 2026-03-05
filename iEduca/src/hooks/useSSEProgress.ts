import { useEffect, useState, useRef } from 'react';

interface ProgressData {
  correcaoId: number;
  progresso: number;
  status: string;
  notaTotal?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useSSEProgress = (correcaoId: number | null) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!correcaoId) {
      console.log('⚠️ Nenhum correcaoId fornecido');
      return;
    }

    mountedRef.current = true;
    console.log('🚀 Iniciando polling para correção:', correcaoId);

    const fetchProgress = async () => {
      if (!mountedRef.current) return;

      try {
        const timestamp = Date.now();
        console.log(`🔄 [${new Date().toLocaleTimeString()}] Fazendo requisição...`);
        
        const response = await fetch(
          `${API_URL}/RedacaoCorrecao/progresso-status/${correcaoId}?t=${timestamp}`, 
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 Resposta recebida:', data);

        if (!mountedRef.current) return;

        setProgressData({
          correcaoId: data.correcaoId || correcaoId,
          progresso: data.progresso || 0,
          status: data.status || 'processando',
          notaTotal: data.notaTotal
        });
        
        setIsConnected(true);
        setError(null);

        if (data.status === 'concluida' || data.status === 'erro') {
          console.log('✅ Status final alcançado:', data.status, '- Parando polling');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('❌ Erro ao buscar progresso:', err);
        if (mountedRef.current) {
          setError('Erro ao conectar com o servidor');
          setIsConnected(false);
        }
      }
    };

    fetchProgress();

    intervalRef.current = setInterval(fetchProgress, 1000);

    return () => {
      console.log('🛑 Limpando polling');
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [correcaoId]);

  return { progressData, error, isConnected };
};
