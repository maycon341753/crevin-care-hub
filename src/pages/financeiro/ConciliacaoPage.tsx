import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Banknote,
  CreditCard,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatBrazilianCurrency, formatBrazilianDate } from '@/lib/utils';
import AddContaBancariaModal from '@/components/financeiro/AddContaBancariaModal';
import AddMovimentoBancarioModal from '@/components/financeiro/AddMovimentoBancarioModal';

interface MovimentoBancario {
  id: string;
  data_movimento: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  status_conciliacao: 'conciliado' | 'pendente' | 'divergente';
  conta_bancaria_id: string;
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

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_atual: number;
  ativo: boolean;
}

const ConciliacaoPage = () => {
  const [loading, setLoading] = useState(true);
  const [movimentos, setMovimentos] = useState<MovimentoBancario[]>([]);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [contaFilter, setContaFilter] = useState('todas');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchMovimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('movimentos_bancarios')
        .select(`
          *,
          conta_bancaria:contas_bancarias(nome, banco, agencia, conta)
        `)
        .order('data_movimento', { ascending: false });

      if (error) throw error;
      setMovimentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar movimentos:', error);
      toast.error('Erro ao carregar movimentos bancários');
    }
  };

  const fetchContasBancarias = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setContasBancarias(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
      toast.error('Erro ao carregar contas bancárias');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMovimentos(),
        fetchContasBancarias()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de conciliação');
    } finally {
      setLoading(false);
    }
  };

  const handleConciliar = async (movimentoId: string) => {
    try {
      const { error } = await supabase
        .from('movimentos_bancarios')
        .update({ status_conciliacao: 'conciliado' })
        .eq('id', movimentoId);

      if (error) throw error;
      
      toast.success('Movimento conciliado com sucesso!');
      fetchMovimentos();
    } catch (error) {
      console.error('Erro ao conciliar movimento:', error);
      toast.error('Erro ao conciliar movimento');
    }
  };

  const handleMarcarDivergente = async (movimentoId: string) => {
    try {
      const { error } = await supabase
        .from('movimentos_bancarios')
        .update({ status_conciliacao: 'divergente' })
        .eq('id', movimentoId);

      if (error) throw error;
      
      toast.success('Movimento marcado como divergente!');
      fetchMovimentos();
    } catch (error) {
      console.error('Erro ao marcar divergência:', error);
      toast.error('Erro ao marcar divergência');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'conciliado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Conciliado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'divergente':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Divergente</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'entrada' 
      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Entrada</Badge>
      : <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Saída</Badge>;
  };

  const filteredMovimentos = movimentos.filter(movimento => {
    const matchesSearch = movimento.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movimento.documento?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || movimento.status_conciliacao === statusFilter;
    const matchesConta = contaFilter === 'todas' || movimento.conta_bancaria_id === contaFilter;
    const matchesTipo = tipoFilter === 'todos' || movimento.tipo === tipoFilter;
    
    let matchesData = true;
    if (dataInicio && dataFim) {
      const dataMovimento = new Date(movimento.data_movimento);
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      matchesData = dataMovimento >= inicio && dataMovimento <= fim;
    }
    
    return matchesSearch && matchesStatus && matchesConta && matchesTipo && matchesData;
  });

  const resumo = {
    totalMovimentos: filteredMovimentos.length,
    conciliados: filteredMovimentos.filter(m => m.status_conciliacao === 'conciliado').length,
    pendentes: filteredMovimentos.filter(m => m.status_conciliacao === 'pendente').length,
    divergentes: filteredMovimentos.filter(m => m.status_conciliacao === 'divergente').length,
    totalEntradas: filteredMovimentos.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0),
    totalSaidas: filteredMovimentos.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0),
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
          <h1 className="text-3xl font-bold text-gray-900">Conciliação Bancária</h1>
          <p className="text-gray-600">Concilie os movimentos bancários com o sistema</p>
        </div>
        <div className="flex gap-2">
          <AddContaBancariaModal onContaAdded={fetchData} />
          <AddMovimentoBancarioModal onMovimentoAdded={fetchData} />
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar OFX
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Movimentos</p>
                <p className="text-2xl font-bold text-blue-600">{resumo.totalMovimentos}</p>
              </div>
              <Banknote className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conciliados</p>
                <p className="text-2xl font-bold text-green-600">{resumo.conciliados}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{resumo.pendentes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Divergentes</p>
                <p className="text-2xl font-bold text-red-600">{resumo.divergentes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {resumo.totalEntradas > 0 ? formatBrazilianCurrency(resumo.totalEntradas) : '—'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  {resumo.totalSaidas > 0 ? formatBrazilianCurrency(resumo.totalSaidas) : '—'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="conciliado">Conciliado</SelectItem>
                <SelectItem value="divergente">Divergente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={contaFilter} onValueChange={setContaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Conta Bancária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Contas</SelectItem>
                {contasBancarias.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.nome} - {conta.banco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data Início"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data Fim"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Movimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Movimentos Bancários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Conta</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovimentos.map((movimento) => (
                  <tr key={movimento.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{formatBrazilianDate(movimento.data_movimento)}</td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{movimento.descricao}</p>
                        {movimento.documento && (
                          <p className="text-sm text-gray-500">Doc: {movimento.documento}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{getTipoBadge(movimento.tipo)}</td>
                    <td className="p-2">
                      <span className={movimento.tipo === 'entrada' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {movimento.tipo === 'entrada' ? '+' : '-'} {formatBrazilianCurrency(movimento.valor)}
                      </span>
                    </td>
                    <td className="p-2">
                      {movimento.conta_bancaria ? (
                        <div>
                          <p className="font-medium">{movimento.conta_bancaria.nome}</p>
                          <p className="text-sm text-gray-500">
                            {movimento.conta_bancaria.banco} - Ag: {movimento.conta_bancaria.agencia}, Conta: {movimento.conta_bancaria.conta}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-2">{getStatusBadge(movimento.status_conciliacao)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {movimento.status_conciliacao === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConciliar(movimento.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarcarDivergente(movimento.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredMovimentos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum movimento encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConciliacaoPage;