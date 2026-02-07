import { supabase } from '@/integrations/supabase/client';

interface ContaRecorrente {
  id: string;
  descricao: string;
  valor: number;
  categoria_id: string;
  fornecedor_nome?: string;
  fornecedor_cnpj?: string;
  fornecedor_telefone?: string;
  forma_pagamento: string;
  observacoes?: string;
  frequencia_recorrencia: string;
  data_proxima_geracao: string;
  created_by: string;
}

export class ContasRecorrentesService {
  /**
   * Gera as próximas parcelas das contas recorrentes que estão vencidas
   */
  static async gerarContasRecorrentes(): Promise<void> {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      // Buscar contas recorrentes que precisam gerar nova parcela
      const { data: contasRecorrentes, error: fetchError } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('recorrente', true)
        .lte('data_proxima_geracao', hoje)
        .eq('status', 'pendente'); // Só gerar se a conta original ainda está pendente

      if (fetchError) {
        console.error('Erro ao buscar contas recorrentes:', fetchError);
        return;
      }

      if (!contasRecorrentes || contasRecorrentes.length === 0) {
        console.log('Nenhuma conta recorrente para gerar');
        return;
      }

      for (const conta of contasRecorrentes) {
        await this.gerarProximaParcela(conta);
      }

      console.log(`${contasRecorrentes.length} contas recorrentes processadas`);
    } catch (error) {
      console.error('Erro ao gerar contas recorrentes:', error);
    }
  }

  /**
   * Gera a próxima parcela de uma conta recorrente específica
   */
  private static async gerarProximaParcela(contaOriginal: ContaRecorrente): Promise<void> {
    try {
      const dataProximaGeracao = new Date(contaOriginal.data_proxima_geracao);
      const novaDataVencimento = new Date(dataProximaGeracao);
      
      // Calcular a próxima data de geração baseada na frequência
      const proximaDataGeracao = new Date(dataProximaGeracao);
      
      switch (contaOriginal.frequencia_recorrencia) {
        case 'mensal':
          proximaDataGeracao.setMonth(proximaDataGeracao.getMonth() + 1);
          break;
        case 'bimestral':
          proximaDataGeracao.setMonth(proximaDataGeracao.getMonth() + 2);
          break;
        case 'trimestral':
          proximaDataGeracao.setMonth(proximaDataGeracao.getMonth() + 3);
          break;
        case 'semestral':
          proximaDataGeracao.setMonth(proximaDataGeracao.getMonth() + 6);
          break;
        case 'anual':
          proximaDataGeracao.setFullYear(proximaDataGeracao.getFullYear() + 1);
          break;
      }

      // Criar nova parcela
      const novaConta = {
        descricao: `${contaOriginal.descricao} - ${this.formatarMesAno(novaDataVencimento)}`,
        valor: contaOriginal.valor,
        data_vencimento: novaDataVencimento.toISOString().split('T')[0],
        categoria_id: contaOriginal.categoria_id,
        fornecedor_nome: contaOriginal.fornecedor_nome,
        fornecedor_cnpj: contaOriginal.fornecedor_cnpj,
        fornecedor_telefone: contaOriginal.fornecedor_telefone,
        forma_pagamento: contaOriginal.forma_pagamento,
        observacoes: contaOriginal.observacoes,
        status: 'pendente',
        recorrente: true,
        frequencia_recorrencia: contaOriginal.frequencia_recorrencia,
        data_proxima_geracao: proximaDataGeracao.toISOString().split('T')[0],
        conta_origem_id: contaOriginal.id,
        created_by: contaOriginal.created_by
      };

      // Inserir nova conta
      const { error: insertError } = await supabase
        .from('contas_pagar')
        .insert([novaConta]);

      if (insertError) {
        console.error('Erro ao inserir nova parcela:', insertError);
        return;
      }

      // Atualizar a data da próxima geração na conta original
      const { error: updateError } = await supabase
        .from('contas_pagar')
        .update({ data_proxima_geracao: proximaDataGeracao.toISOString().split('T')[0] })
        .eq('id', contaOriginal.id);

      if (updateError) {
        console.error('Erro ao atualizar data de próxima geração:', updateError);
      }

      console.log(`Nova parcela gerada para: ${contaOriginal.descricao}`);
    } catch (error) {
      console.error('Erro ao gerar próxima parcela:', error);
    }
  }

  /**
   * Formatar mês e ano para exibição
   */
  private static formatarMesAno(data: Date): string {
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    return `${meses[data.getMonth()]}/${data.getFullYear()}`;
  }

  /**
   * Verificar e gerar contas recorrentes (pode ser chamado periodicamente)
   */
  static async verificarEGerarContas(): Promise<void> {
    console.log('Verificando contas recorrentes...');
    await this.gerarContasRecorrentes();
  }
}