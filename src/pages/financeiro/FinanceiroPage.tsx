import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AddContaReceberModal from '@/components/financeiro/AddContaReceberModal';
import AddContaPagarModal from '@/components/financeiro/AddContaPagarModal';
import EditContaReceberModal from '@/components/financeiro/EditContaReceberModal';
import EditContaPagarModal from '@/components/financeiro/EditContaPagarModal';

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento?: string;
  categoria_id: string;
  pagador_nome?: string;
  forma_pagamento?: string;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
  observacoes?: string;
  categorias_financeiras: CategoriaFinanceira;
}

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  categoria_id: string;
  fornecedor_nome: string;
  forma_pagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  observacoes?: string;
  categorias_financeiras: CategoriaFinanceira;
}

interface ResumoFinanceiro {
  totalReceber: number;
  totalPagar: number;
  receitasRecebidas: number;
  despesasPagas: number;
  contasVencidas: number;
}

const FinanceiroPage: React.FC = () => {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalReceber: 0,
    totalPagar: 0,
    receitasRecebidas: 0,
    despesasPagas: 0,
    contasVencidas: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [showAddReceberModal, setShowAddReceberModal] = useState(false);
  const [showAddPagarModal, setShowAddPagarModal] = useState(false);
  const [editingContaReceber, setEditingContaReceber] = useState<ContaReceber | null>(null);
  const [editingContaPagar, setEditingContaPagar] = useState<ContaPagar | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchContasReceber(),
        fetchContasPagar(),
        fetchCategorias()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const fetchContasReceber = async () => {
    const { data, error } = await supabase
      .from('contas_receber')
      .select(`
        *,
        categorias_financeiras (
          id,
          nome,
          tipo,
          cor
        )
      `)
      .order('data_vencimento', { ascending: true });

    if (error) {
      console.error('Erro ao buscar contas a receber:', error);
      return;
    }

    setContasReceber(data || []);
  };

  const fetchContasPagar = async () => {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select(`
        *,
        categorias_financeiras (
          id,
          nome,
          tipo,
          cor
        )
      `)
      .order('data_vencimento', { ascending: true });

    if (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      return;
    }

    setContasPagar(data || []);
  };

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from('categorias_financeiras')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return;
    }

    setCategorias(data || []);
  };

  // Calcular resumo financeiro
  useEffect(() => {
    const totalReceber = contasReceber
      .filter(conta => conta.status === 'pendente')
      .reduce((sum, conta) => sum + conta.valor, 0);

    const totalPagar = contasPagar
      .filter(conta => conta.status === 'pendente')
      .reduce((sum, conta) => sum + conta.valor, 0);

    const receitasRecebidas = contasReceber
      .filter(conta => conta.status === 'recebido')
      .reduce((sum, conta) => sum + conta.valor, 0);

    const despesasPagas = contasPagar
      .filter(conta => conta.status === 'pago')
      .reduce((sum, conta) => sum + conta.valor, 0);

    const hoje = new Date().toISOString().split('T')[0];
    const contasVencidas = [
      ...contasReceber.filter(conta => conta.status === 'pendente' && conta.data_vencimento < hoje),
      ...contasPagar.filter(conta => conta.status === 'pendente' && conta.data_vencimento < hoje)
    ].length;

    setResumo({
      totalReceber,
      totalPagar,
      receitasRecebidas,
      despesasPagas,
      contasVencidas
    });
  }, [contasReceber, contasPagar]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      recebido: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Recebido' },
      pago: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Pago' },
      vencido: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Vencido' },
      cancelado: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge className={config?.color || 'bg-gray-100 text-gray-800'}>
        <Icon className="w-3 h-3 mr-1" />
        {config?.label || status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const filteredContasReceber = contasReceber.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.pagador_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || conta.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContasPagar = contasPagar.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || conta.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteContaReceber = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta a receber?')) return;

    const { error } = await supabase
      .from('contas_receber')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir conta a receber');
      return;
    }

    toast.success('Conta a receber excluída com sucesso');
    fetchContasReceber();
  };

  const handleDeleteContaPagar = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta a pagar?')) return;

    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir conta a pagar');
      return;
    }

    toast.success('Conta a pagar excluída com sucesso');
    fetchContasPagar();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Gestão de contas a pagar e receber</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">A Receber</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(resumo.totalReceber)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">A Pagar</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(resumo.totalPagar)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recebido</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(resumo.receitasRecebidas)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pago</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(resumo.despesasPagas)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-orange-600">{resumo.contasVencidas}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por descrição ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="recebido">Recebido</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Contas */}
      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contas a Receber</h2>
            <Button onClick={() => setShowAddReceberModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Receber
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContasReceber.map((conta) => (
                      <tr key={conta.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{conta.descricao}</div>
                            <div className="text-sm text-gray-500">{conta.categorias_financeiras.nome}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(conta.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(conta.data_vencimento)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {conta.pagador_nome || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(conta.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingContaReceber(conta)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteContaReceber(conta.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contas a Pagar</h2>
            <Button onClick={() => setShowAddPagarModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContasPagar.map((conta) => (
                      <tr key={conta.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{conta.descricao}</div>
                            <div className="text-sm text-gray-500">{conta.categorias_financeiras.nome}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {formatCurrency(conta.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(conta.data_vencimento)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {conta.fornecedor_nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(conta.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingContaPagar(conta)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteContaPagar(conta.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      {showAddReceberModal && (
        <AddContaReceberModal
          isOpen={showAddReceberModal}
          onClose={() => setShowAddReceberModal(false)}
          onSuccess={() => {
            setShowAddReceberModal(false);
            fetchContasReceber();
          }}
          categorias={categorias.filter(c => c.tipo === 'receita')}
        />
      )}

      {showAddPagarModal && (
        <AddContaPagarModal
          isOpen={showAddPagarModal}
          onClose={() => setShowAddPagarModal(false)}
          onSuccess={() => {
            setShowAddPagarModal(false);
            fetchContasPagar();
          }}
          categorias={categorias.filter(c => c.tipo === 'despesa')}
        />
      )}

      {editingContaReceber && (
        <EditContaReceberModal
          isOpen={!!editingContaReceber}
          onClose={() => setEditingContaReceber(null)}
          onSuccess={() => {
            setEditingContaReceber(null);
            fetchContasReceber();
          }}
          conta={editingContaReceber}
          categorias={categorias.filter(c => c.tipo === 'receita')}
        />
      )}

      {editingContaPagar && (
        <EditContaPagarModal
          isOpen={!!editingContaPagar}
          onClose={() => setEditingContaPagar(null)}
          onSuccess={() => {
            setEditingContaPagar(null);
            fetchContasPagar();
          }}
          conta={editingContaPagar}
          categorias={categorias.filter(c => c.tipo === 'despesa')}
        />
      )}
    </div>
  );
};

export default FinanceiroPage;