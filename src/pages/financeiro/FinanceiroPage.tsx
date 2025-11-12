import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileText,
  Download,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatBrazilianCurrency, formatBrazilianDate } from '@/lib/utils';
import AddContaReceberModal from '@/components/financeiro/AddContaReceberModal';
import EditContaReceberModal from '@/components/financeiro/EditContaReceberModal';
import AddContaPagarModal from '@/components/financeiro/AddContaPagarModal';
import EditContaPagarModal from '@/components/financeiro/EditContaPagarModal';

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'vencido';
  categoria_id?: string;
  observacoes?: string;
  recorrente?: boolean;
  created_at: string;
  updated_at: string;
}

interface ContaPagar {
  id: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'vencido';
  categoria_id?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor?: string;
}

const FinanceiroPage: React.FC = () => {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isContaReceberModalOpen, setIsContaReceberModalOpen] = useState(false);
  const [isContaPagarModalOpen, setIsContaPagarModalOpen] = useState(false);
  const [editingContaReceber, setEditingContaReceber] = useState<ContaReceber | null>(null);
  const [editingContaPagar, setEditingContaPagar] = useState<ContaPagar | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [contasReceberResponse, contasPagarResponse, categoriasResponse] = await Promise.all([
        supabase.from('contas_receber').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('contas_pagar').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('categorias_financeiras').select('*').order('nome')
      ]);

      if (contasReceberResponse.error) throw contasReceberResponse.error;
      if (contasPagarResponse.error) throw contasPagarResponse.error;
      if (categoriasResponse.error) throw categoriasResponse.error;

      setContasReceber(contasReceberResponse.data || []);
      setContasPagar(contasPagarResponse.data || []);
      setCategorias(categoriasResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  // Cálculos financeiros
  const totalReceber = contasReceber
    .filter(conta => conta.status !== 'pago')
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalPagar = contasPagar
    .filter(conta => conta.status !== 'pago')
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalRecebido = contasReceber
    .filter(conta => conta.status === 'pago')
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalPago = contasPagar
    .filter(conta => conta.status === 'pago')
    .reduce((sum, conta) => sum + conta.valor, 0);

  const saldoAtual = totalRecebido - totalPago;

  // Receitas do mês atual (a receber no mês: pendentes e vencidas dentro do mês)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalReceitasMes = contasReceber
    .filter(conta => {
      const data = new Date(conta.data_vencimento);
      const isMesAtual = data.getMonth() === currentMonth && data.getFullYear() === currentYear;
      return isMesAtual && conta.status !== 'pago';
    })
    .reduce((sum, conta) => sum + conta.valor, 0);

  // Funções de filtro
  const filteredContasReceber = contasReceber.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || conta.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContasPagar = contasPagar.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || conta.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Funções de CRUD
  const handleDeleteContaReceber = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contas_receber')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContasReceber(prev => prev.filter(conta => conta.id !== id));
      toast.success('Conta a receber excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir conta a receber:', error);
      toast.error('Erro ao excluir conta a receber');
    }
  };

  const handleDeleteContaPagar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContasPagar(prev => prev.filter(conta => conta.id !== id));
      toast.success('Conta a pagar excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir conta a pagar:', error);
      toast.error('Erro ao excluir conta a pagar');
    }
  };

  // Função para gerar relatório CSV
  const handleGerarRelatorioCSV = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const contasReceberMes = contasReceber.filter(conta => {
      const dataVencimento = new Date(conta.data_vencimento);
      return dataVencimento.getMonth() === currentMonth && dataVencimento.getFullYear() === currentYear;
    });
    
    const contasPagarMes = contasPagar.filter(conta => {
      const dataVencimento = new Date(conta.data_vencimento);
      return dataVencimento.getMonth() === currentMonth && dataVencimento.getFullYear() === currentYear;
    });

    const totalReceberMes = contasReceberMes.reduce((sum, conta) => sum + conta.valor, 0);
    const totalPagarMes = contasPagarMes.reduce((sum, conta) => sum + conta.valor, 0);

    let csvContent = 'Relatório Financeiro - ' + format(new Date(), 'MMMM yyyy', { locale: ptBR }) + '\n\n';
    csvContent += 'RESUMO FINANCEIRO\n';
    csvContent += 'Total a Receber,' + formatBrazilianCurrency(totalReceberMes) + '\n';
    csvContent += 'Total a Pagar,' + formatBrazilianCurrency(totalPagarMes) + '\n';
    csvContent += 'Saldo Previsto,' + formatBrazilianCurrency(totalReceberMes - totalPagarMes) + '\n\n';
    
    csvContent += 'CONTAS A RECEBER\n';
    csvContent += 'Descrição,Valor,Vencimento,Status\n';
    contasReceberMes.forEach(conta => {
      csvContent += `"${conta.descricao}",${conta.valor},${formatBrazilianDate(conta.data_vencimento)},${conta.status}\n`;
    });
    
    csvContent += '\nCONTAS A PAGAR\n';
    csvContent += 'Descrição,Fornecedor,Valor,Vencimento,Status\n';
    contasPagarMes.forEach(conta => {
      csvContent += `"${conta.descricao}","${conta.fornecedor}",${conta.valor},${formatBrazilianDate(conta.data_vencimento)},${conta.status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${format(new Date(), 'yyyy-MM')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório CSV gerado com sucesso');
  };

  // Função para gerar relatório PDF
  const handleGerarRelatorioPDF = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const contasReceberMes = contasReceber.filter(conta => {
      const dataVencimento = new Date(conta.data_vencimento);
      return dataVencimento.getMonth() === currentMonth && dataVencimento.getFullYear() === currentYear;
    });
    
    const contasPagarMes = contasPagar.filter(conta => {
      const dataVencimento = new Date(conta.data_vencimento);
      return dataVencimento.getMonth() === currentMonth && dataVencimento.getFullYear() === currentYear;
    });

    const totalReceberMes = contasReceberMes.reduce((sum, conta) => sum + conta.valor, 0);
    const totalPagarMes = contasPagarMes.reduce((sum, conta) => sum + conta.valor, 0);

    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 20, 20);
    doc.setFontSize(12);
    doc.text(format(new Date(), 'MMMM yyyy', { locale: ptBR }), 20, 30);
    
    // Resumo financeiro
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 20, 50);
    doc.setFontSize(10);
    doc.text(`Total a Receber: ${formatBrazilianCurrency(totalReceberMes)}`, 20, 60);
    doc.text(`Total a Pagar: ${formatBrazilianCurrency(totalPagarMes)}`, 20, 70);
    doc.text(`Saldo Previsto: ${formatBrazilianCurrency(totalReceberMes - totalPagarMes)}`, 20, 80);
    
    // Contas a Receber
    if (contasReceberMes.length > 0) {
      doc.setFontSize(14);
      doc.text('Contas a Receber', 20, 100);
      
      const receberData = contasReceberMes.map(conta => [
        conta.descricao,
        formatBrazilianCurrency(conta.valor),
        formatBrazilianDate(conta.data_vencimento),
        conta.status === 'pago' ? 'Pago' : conta.status === 'vencido' ? 'Vencido' : 'Pendente'
      ]);
      
      autoTable(doc, {
        head: [['Descrição', 'Valor', 'Vencimento', 'Status']],
        body: receberData,
        startY: 110,
        styles: { fontSize: 8 }
      });
    }
    
    // Contas a Pagar
    if (contasPagarMes.length > 0) {
      const startY = contasReceberMes.length > 0 ? (doc as any).lastAutoTable.finalY + 20 : 110;
      
      doc.setFontSize(14);
      doc.text('Contas a Pagar', 20, startY);
      
      const pagarData = contasPagarMes.map(conta => [
        conta.descricao,
        conta.fornecedor,
        formatBrazilianCurrency(conta.valor),
        formatBrazilianDate(conta.data_vencimento),
        conta.status === 'pago' ? 'Pago' : conta.status === 'vencido' ? 'Vencido' : 'Pendente'
      ]);
      
      autoTable(doc, {
        head: [['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status']],
        body: pagarData,
        startY: startY + 10,
        styles: { fontSize: 8 }
      });
    }
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 120, doc.internal.pageSize.height - 10);
    }
    
    doc.save(`relatorio-financeiro-${format(new Date(), 'yyyy-MM')}.pdf`);
    toast.success('Relatório PDF gerado com sucesso');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'vencido':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
      case 'pendente':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-gray-600">Gestão financeira completa</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGerarRelatorioCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Relatório CSV
          </Button>
          <Button onClick={handleGerarRelatorioPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Relatório PDF
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBrazilianCurrency(totalReceitasMes)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatBrazilianCurrency(saldoAtual)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBrazilianCurrency(totalRecebido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatBrazilianCurrency(totalReceber)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatBrazilianCurrency(totalPagar)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contas a Receber</h2>
            <Button onClick={() => setIsContaReceberModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContasReceber.map((conta) => (
                      <tr key={conta.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{conta.descricao}</div>
                          {conta.observacoes && (
                            <div className="text-sm text-gray-500">{conta.observacoes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBrazilianCurrency(conta.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBrazilianDate(conta.data_vencimento)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(conta.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingContaReceber(conta)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContaReceber(conta.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
            <Button onClick={() => setIsContaPagarModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
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
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
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
                      <tr key={conta.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{conta.descricao}</div>
                          {conta.observacoes && (
                            <div className="text-sm text-gray-500">{conta.observacoes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {conta.fornecedor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBrazilianCurrency(conta.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBrazilianDate(conta.data_vencimento)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(conta.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingContaPagar(conta)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContaPagar(conta.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Modals */}
      <AddContaReceberModal
        isOpen={isContaReceberModalOpen}
        onClose={() => setIsContaReceberModalOpen(false)}
        onSuccess={fetchData}
        categorias={categorias}
      />

      <EditContaReceberModal
        isOpen={!!editingContaReceber}
        onClose={() => setEditingContaReceber(null)}
        onSuccess={() => {
          fetchData();
          setEditingContaReceber(null);
        }}
        categorias={categorias}
        conta={editingContaReceber}
      />

      <AddContaPagarModal
        isOpen={isContaPagarModalOpen}
        onClose={() => setIsContaPagarModalOpen(false)}
        onSuccess={fetchData}
        categorias={categorias}
      />

      <EditContaPagarModal
        isOpen={!!editingContaPagar}
        onClose={() => setEditingContaPagar(null)}
        onSuccess={() => {
          fetchData();
          setEditingContaPagar(null);
        }}
        categorias={categorias}
        conta={editingContaPagar}
      />
    </div>
  );
};

export default FinanceiroPage;