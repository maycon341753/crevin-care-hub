import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, ArrowUpDown, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatBrazilianCurrency, formatBrazilianDate } from '@/lib/utils';
import AddContaBancariaModal from '@/components/financeiro/AddContaBancariaModal';
import AddMovimentoBancarioModal from '@/components/financeiro/AddMovimentoBancarioModal';

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: 'corrente' | 'poupanca' | 'aplicacao';
  saldo_inicial: number;
  saldo_atual: number;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
}

interface MovimentoBancario {
  id: string;
  conta_bancaria_id: string;
  data_movimento: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  status_conciliacao: 'conciliado' | 'pendente' | 'divergente';
  documento?: string;
  observacoes?: string;
  created_at: string;
  conta_bancaria?: {
    nome: string;
    banco: string;
    agencia: string;
    conta: string;
  };
}

const ContasBancariasPage: React.FC = () => {
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoBancario[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showInativos, setShowInativos] = useState(false);

  useEffect(() => {
    fetchContasBancarias();
  }, [showInativos]);

  useEffect(() => {
    if (contaSelecionada) {
      fetchMovimentos();
    } else {
      setMovimentos([]);
    }
  }, [contaSelecionada]);

  const fetchContasBancarias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('ativo', showInativos ? false : true)
        .order('nome');

      if (error) throw error;
      setContasBancarias(data || []);
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      toast.error('Erro ao carregar contas bancárias');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovimentos = async () => {
    if (!contaSelecionada) return;

    try {
      const { data, error } = await supabase
        .from('movimentos_bancarios')
        .select(`
          *,
          conta_bancaria:contas_bancarias(nome, banco, agencia, conta)
        `)
        .eq('conta_bancaria_id', contaSelecionada)
        .order('data_movimento', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovimentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar movimentos:', error);
      toast.error('Erro ao carregar movimentos');
    }
  };

  const handleToggleAtivo = async (contaId: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('contas_bancarias')
        .update({ ativo: !ativo })
        .eq('id', contaId);

      if (error) throw error;

      toast.success(`Conta ${!ativo ? 'ativada' : 'desativada'} com sucesso!`);
      fetchContasBancarias();
      
      if (contaSelecionada === contaId && !ativo) {
        setContaSelecionada('');
      }
    } catch (error) {
      console.error('Erro ao alterar status da conta:', error);
      toast.error('Erro ao alterar status da conta');
    }
  };

  const handleDeleteMovimento = async (movimentoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este movimento?')) return;

    try {
      const { error } = await supabase
        .from('movimentos_bancarios')
        .delete()
        .eq('id', movimentoId);

      if (error) throw error;

      toast.success('Movimento excluído com sucesso!');
      fetchMovimentos();
      fetchContasBancarias(); // Atualizar saldos
    } catch (error) {
      console.error('Erro ao excluir movimento:', error);
      toast.error('Erro ao excluir movimento');
    }
  };

  const contaAtual = contasBancarias.find(conta => conta.id === contaSelecionada);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      conciliado: { label: 'Conciliado', variant: 'default' as const },
      pendente: { label: 'Pendente', variant: 'secondary' as const },
      divergente: { label: 'Divergente', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTipoContaBadge = (tipo: string) => {
    const tipoConfig = {
      corrente: { label: 'Corrente', variant: 'default' as const },
      poupanca: { label: 'Poupança', variant: 'secondary' as const },
      aplicacao: { label: 'Aplicação', variant: 'outline' as const }
    };
    
    const config = tipoConfig[tipo as keyof typeof tipoConfig] || tipoConfig.corrente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando contas bancárias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground">
            Gerencie as contas bancárias e movimentações da instituição
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowInativos(!showInativos)}
          >
            {showInativos ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showInativos ? 'Ver Ativas' : 'Ver Inativas'}
          </Button>
          <AddContaBancariaModal onContaAdded={fetchContasBancarias} />
          <AddMovimentoBancarioModal 
            onMovimentoAdded={() => {
              fetchMovimentos();
              fetchContasBancarias(); // Atualizar saldos
            }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Contas Bancárias */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {showInativos ? 'Contas Inativas' : 'Contas Ativas'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {contasBancarias.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {showInativos ? 'Nenhuma conta inativa encontrada' : 'Nenhuma conta bancária cadastrada'}
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {contasBancarias.map((conta) => (
                    <div
                      key={conta.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        contaSelecionada === conta.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setContaSelecionada(conta.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{conta.nome}</h3>
                          <p className="text-sm text-gray-600">{conta.banco}</p>
                        </div>
                        <div className="flex gap-1">
                          {getTipoContaBadge(conta.tipo_conta)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAtivo(conta.id, conta.ativo);
                            }}
                          >
                            {conta.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Ag: {conta.agencia} | Conta: {conta.conta}</p>
                        <p className="font-semibold text-lg mt-1">
                          {formatBrazilianCurrency(conta.saldo_atual)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes da Conta e Movimentos */}
        <div className="lg:col-span-2">
          {contaAtual ? (
            <div className="space-y-6">
              {/* Detalhes da Conta */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Conta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="font-semibold">{contaAtual.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Banco</p>
                      <p className="font-semibold">{contaAtual.banco}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Agência</p>
                      <p className="font-semibold">{contaAtual.agencia}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Conta</p>
                      <p className="font-semibold">{contaAtual.conta}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo Inicial</p>
                      <p className="font-semibold">{formatBrazilianCurrency(contaAtual.saldo_inicial)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo Atual</p>
                      <p className="font-semibold text-lg">{formatBrazilianCurrency(contaAtual.saldo_atual)}</p>
                    </div>
                  </div>
                  {contaAtual.observacoes && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Observações</p>
                      <p>{contaAtual.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Movimentos */}
              <Card>
                <CardHeader>
                  <CardTitle>Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  {movimentos.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      Nenhuma movimentação encontrada para esta conta
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {movimentos.map((movimento) => (
                        <div
                          key={movimento.id}
                          className="flex justify-between items-center p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{movimento.descricao}</span>
                              {getStatusBadge(movimento.status_conciliacao)}
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>{formatBrazilianDate(movimento.data_movimento)}</p>
                              {movimento.conta_bancaria && (
                                <p className="text-blue-600 font-medium">
                                  {movimento.conta_bancaria.nome} - {movimento.conta_bancaria.banco} 
                                  (Ag: {movimento.conta_bancaria.agencia}, Conta: {movimento.conta_bancaria.conta})
                                </p>
                              )}
                              {movimento.documento && <p>Doc: {movimento.documento}</p>}
                              {movimento.observacoes && <p>{movimento.observacoes}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`font-semibold text-lg ${
                                movimento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {movimento.tipo === 'entrada' ? '+' : '-'} {formatBrazilianCurrency(movimento.valor)}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMovimento(movimento.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma conta bancária para ver os detalhes e movimentações</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContasBancariasPage;