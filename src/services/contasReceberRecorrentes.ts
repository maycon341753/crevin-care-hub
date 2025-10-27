import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContaReceberRecorrente {
  id: string;
  descricao: string;
  valor: number;
  categoria_id: string;
  idoso_id?: string;
  pagador_nome?: string;
  pagador_cpf?: string;
  pagador_telefone?: string;
  forma_pagamento?: string;
  observacoes?: string;
  frequencia_recorrencia: string;
  data_vencimento: string;
  created_by: string;
}

/**
 * Calcula a próxima data de vencimento baseada na frequência
 */
export const calcularProximaDataVencimento = (dataAtual: string, frequencia: string): string => {
  const data = new Date(dataAtual);
  
  switch (frequencia) {
    case 'semanal':
      data.setDate(data.getDate() + 7);
      break;
    case 'mensal':
      data.setMonth(data.getMonth() + 1);
      break;
    case 'bimestral':
      data.setMonth(data.getMonth() + 2);
      break;
    case 'trimestral':
      data.setMonth(data.getMonth() + 3);
      break;
    case 'semestral':
      data.setMonth(data.getMonth() + 6);
      break;
    case 'anual':
      data.setFullYear(data.getFullYear() + 1);
      break;
    default:
      data.setMonth(data.getMonth() + 1); // Default para mensal
  }
  
  return data.toISOString().split('T')[0];
};

/**
 * Gera uma nova conta a receber baseada em uma conta recorrente
 */
export const gerarContaRecorrenteReceber = async (contaOriginal: ContaReceberRecorrente): Promise<boolean> => {
  try {
    const proximaDataVencimento = calcularProximaDataVencimento(
      contaOriginal.data_vencimento, 
      contaOriginal.frequencia_recorrencia
    );

    // Criar nova conta a receber
    const novaContaData = {
      descricao: contaOriginal.descricao,
      valor: contaOriginal.valor,
      data_vencimento: proximaDataVencimento,
      categoria_id: contaOriginal.categoria_id,
      idoso_id: contaOriginal.idoso_id,
      pagador_nome: contaOriginal.pagador_nome,
      pagador_cpf: contaOriginal.pagador_cpf,
      pagador_telefone: contaOriginal.pagador_telefone,
      forma_pagamento: contaOriginal.forma_pagamento,
      observacoes: contaOriginal.observacoes,
      status: 'pendente',
      recorrente: true,
      frequencia_recorrencia: contaOriginal.frequencia_recorrencia,
      created_by: contaOriginal.created_by,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('contas_receber')
      .insert([novaContaData]);

    if (error) {
      console.error('Erro ao gerar conta recorrente:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao processar conta recorrente:', error);
    return false;
  }
};

/**
 * Processa todas as contas recorrentes que precisam gerar novas instâncias
 */
export const processarContasRecorrentesReceber = async (): Promise<void> => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Buscar contas recorrentes que já venceram e não têm uma próxima instância
    const { data: contasRecorrentes, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('recorrente', true)
      .lte('data_vencimento', hoje);

    if (error) {
      console.error('Erro ao buscar contas recorrentes:', error);
      toast.error('Erro ao processar contas recorrentes');
      return;
    }

    if (!contasRecorrentes || contasRecorrentes.length === 0) {
      return;
    }

    let contasGeradas = 0;

    for (const conta of contasRecorrentes) {
      const proximaDataVencimento = calcularProximaDataVencimento(
        conta.data_vencimento,
        conta.frequencia_recorrencia
      );

      // Verificar se já existe uma conta com a próxima data de vencimento
      const { data: contaExistente } = await supabase
        .from('contas_receber')
        .select('id')
        .eq('descricao', conta.descricao)
        .eq('data_vencimento', proximaDataVencimento)
        .eq('categoria_id', conta.categoria_id)
        .single();

      // Se não existe, gerar nova conta
      if (!contaExistente) {
        const sucesso = await gerarContaRecorrenteReceber({
          ...conta,
          data_vencimento: proximaDataVencimento
        });

        if (sucesso) {
          contasGeradas++;
        }
      }
    }

    if (contasGeradas > 0) {
      toast.success(`${contasGeradas} conta(s) recorrente(s) gerada(s) com sucesso!`);
    }

  } catch (error) {
    console.error('Erro ao processar contas recorrentes:', error);
    toast.error('Erro ao processar contas recorrentes');
  }
};

/**
 * Função para ser chamada periodicamente (pode ser integrada com um cron job)
 */
export const executarProcessamentoRecorrenteReceber = async (): Promise<void> => {
  console.log('Iniciando processamento de contas recorrentes a receber...');
  await processarContasRecorrentesReceber();
  console.log('Processamento de contas recorrentes a receber concluído.');
};