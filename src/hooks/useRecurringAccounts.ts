import { useEffect, useRef } from 'react';
import { processarContasRecorrentesReceber } from '@/services/contasReceberRecorrentes';
import { useToast } from '@/hooks/use-toast';

export function useRecurringAccounts() {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const processRecurringAccountsWithToast = async () => {
    if (isProcessingRef.current) {
      return; // Evita processamento simultâneo
    }

    try {
      isProcessingRef.current = true;
      await processarContasRecorrentesReceber();
      
      // A função processarContasRecorrentesReceber já exibe toasts internamente
      // então não precisamos exibir toast aqui
    } catch (error) {
      console.error('Erro ao processar contas recorrentes:', error);
      toast({
        title: "Erro no Processamento",
        description: "Erro ao processar contas recorrentes. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      isProcessingRef.current = false;
    }
  };

  const startRecurringProcessing = () => {
    // Processa imediatamente ao iniciar
    processRecurringAccountsWithToast();
    
    // Configura processamento a cada 24 horas (86400000 ms)
    intervalRef.current = setInterval(processRecurringAccountsWithToast, 24 * 60 * 60 * 1000);
  };

  const stopRecurringProcessing = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startRecurringProcessing();

    return () => {
      stopRecurringProcessing();
    };
  }, []);

  return {
    processRecurringAccountsManually: processRecurringAccountsWithToast,
    startRecurringProcessing,
    stopRecurringProcessing,
  };
}