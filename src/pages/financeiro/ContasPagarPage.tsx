import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AddContaPagarModal from '@/components/financeiro/AddContaPagarModal';
import EditContaPagarModal from '@/components/financeiro/EditContaPagarModal';
import { formatBrazilianCurrency, formatBrazilianDate } from '@/lib/utils';
import { ContasRecorrentesService } from '@/services/contasRecorrentes';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
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
  recorrente?: boolean;
  frequencia_recorrencia?: string;
  data_proxima_geracao?: string;
}

const ContasPagarPage: React.FC = () => {
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [loading, setLoading] = useState(true);
  
  // PDF Filters
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaPagar | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
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
      toast.error('Erro ao carregar contas a pagar');
      return;
    }

    setContasPagar(data || []);
  };

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from('categorias_financeiras')
      .select('*')
      .eq('tipo', 'despesa')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return;
    }

    setCategorias(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
      return;
    }

    toast.success('Conta excluÃƒÂ­da com sucesso');
    fetchContasPagar();
  };

  const handleProcessarContasRecorrentes = async () => {
    try {
      setLoading(true);
      await ContasRecorrentesService.verificarEGerarContas();
      toast.success('Contas recorrentes processadas com sucesso!');
      fetchContasPagar(); // Recarregar a lista
    } catch (error) {
      console.error('Erro ao processar contas recorrentes:', error);
      toast.error('Erro ao processar contas recorrentes');
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir modal de relatório PDF
  const handleGerarRelatorioPDF = () => {
    setShowPDFModal(true);
  };

  const confirmarGeracaoPDF = () => {
    try {
      setShowPDFModal(false);
      const doc = new jsPDF();

      // Filtrar contas considerando também o intervalo de datas
      const contasParaRelatorio = filteredContas.filter(conta => {
        if (!pdfStartDate && !pdfEndDate) return true;
        
        const dataVencimento = new Date(conta.data_vencimento);
        const inicio = pdfStartDate ? new Date(pdfStartDate) : null;
        const fim = pdfEndDate ? new Date(pdfEndDate) : null;

        if (inicio && dataVencimento < inicio) return false;
        if (fim && dataVencimento > fim) return false;
        
        return true;
      });

      // Cabeçalho
      doc.setFont('helvetica');
      doc.setFontSize(18);
      doc.text('Relatório de Contas a Pagar', 20, 20);
      doc.setFontSize(12);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);
      
      if (pdfStartDate || pdfEndDate) {
        const periodo = `${pdfStartDate ? format(new Date(pdfStartDate), 'dd/MM/yyyy') : 'Início'} até ${pdfEndDate ? format(new Date(pdfEndDate), 'dd/MM/yyyy') : 'Fim'}`;
        doc.text(`Período: ${periodo}`, 20, 38);
      }

      // Calcular totais baseados nas contas filtradas para o relatório
      const totalRelatorio = contasParaRelatorio.reduce((acc, curr) => {
        if (curr.status === 'pendente') acc.pendente += curr.valor;
        if (curr.status === 'pago') acc.pago += curr.valor;
        if (curr.status === 'vencido') acc.vencido += curr.valor;
        return acc;
      }, { pendente: 0, pago: 0, vencido: 0 });

      // Resumo financeiro
      doc.setFontSize(14);
      doc.text('Resumo', 20, 55);
      doc.setFontSize(10);
      doc.text(`Total Pendente: ${formatBrazilianCurrency(totalRelatorio.pendente)}`, 20, 65);
      doc.text(`Total Pago: ${formatBrazilianCurrency(totalRelatorio.pago)}`, 20, 73);
      doc.text(`Total Vencido: ${formatBrazilianCurrency(totalRelatorio.vencido)}`, 20, 81);

      // Filtros aplicados
      const categoriaNome = categoriaFilter === 'todas' 
        ? 'Todas as categorias' 
        : (categorias.find(c => c.id === categoriaFilter)?.nome || categoriaFilter);
      const statusNome = statusFilter === 'todos' ? 'Todos os status' : statusFilter;
      const busca = searchTerm ? `"${searchTerm}"` : '—';

      doc.setFontSize(12);
      doc.text('Filtros aplicados', 20, 95);
      doc.setFontSize(9);
      doc.text(`Busca: ${busca}`, 20, 103);
      doc.text(`Status: ${statusNome}`, 80, 103);
      doc.text(`Categoria: ${categoriaNome}`, 140, 103);

      // Tabela de contas usando autoTable para melhor legibilidade
      const body = contasParaRelatorio.map(conta => [
        conta.descricao,
        formatBrazilianCurrency(conta.valor),
        formatBrazilianDate(conta.data_vencimento),
        conta.fornecedor_nome,
        conta.categorias_financeiras?.nome || '-',
        conta.status
      ]);

      autoTable(doc, {
        head: [[
          'Descrição', 'Valor', 'Vencimento', 'Fornecedor', 'Categoria', 'Status'
        ]],
        body,
        startY: 113,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240], textColor: 20 },
        theme: 'striped',
      });

      // Rodapé com legenda e paginação
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const h = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.text('Legenda de status: pendente | pago | vencido | cancelado', 20, h - 12);
        doc.text(`Página ${i} de ${pageCount}`, 20, h - 6);
      }

      doc.save(`contas-a-pagar-${format(new Date(), 'yyyy-MM')}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
    }
  };

  // FunÃƒÂ§ÃƒÂ£o para gerar relatÃƒÂ³rio em CSV
  const handleGerarRelatorioCSV = () => {
    try {
      // CabeÃƒÂ§alho do CSV
      const headers = [
        'DescriÃƒÂ§ÃƒÂ£o',
        'Valor',
        'Data Vencimento',
        'Data Pagamento',
        'Fornecedor',
        'Categoria',
        'Status',
        'Forma Pagamento',
        'ObservaÃƒÂ§ÃƒÂµes'
      ];
      
      // Dados das contas
      const csvData = filteredContas.map(conta => [
        conta.descricao,
        conta.valor.toString().replace('.', ','),
        formatBrazilianDate(conta.data_vencimento),
        conta.data_pagamento ? formatBrazilianDate(conta.data_pagamento) : '',
        conta.fornecedor_nome,
        conta.categorias_financeiras.nome,
        conta.status,
        conta.forma_pagamento || '',
        conta.observacoes || ''
      ]);
      
      // Combinar cabeÃƒÂ§alho e dados
      const allData = [headers, ...csvData];
      
      // Converter para string CSV
      const csvContent = allData.map(row => 
        row.map(field => `"${field}"`).join(';')
      ).join('\n');
      
      // Criar e baixar o arquivo
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contas-a-pagar-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('RelatÃƒÂ³rio CSV gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatÃƒÂ³rio CSV:', error);
      toast.error('Erro ao gerar relatÃƒÂ³rio CSV');
    }
  };

  // FunÃƒÂ§ÃƒÂ£o para calcular prÃƒÂ³xima data de pagamento baseada na frequÃƒÂªncia
  const calcularProximaDataPagamento = (dataVencimento: string, frequencia: string): string => {
    const data = new Date(dataVencimento);
    
    switch (frequencia) {
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
        data.setMonth(data.getMonth() + 1);
    }
    
    return data.toISOString().split('T')[0];
  };

  const getDisplayStatus = (conta: ContaPagar): 'pendente' | 'pago' | 'vencido' | 'cancelado' => {
    try {
      if (conta.recorrente && conta.status === 'pago') {
        return 'pendente';
      }
    } catch {}
    return conta.status;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      pago: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Pago' },
      vencido: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Vencido' },
      cancelado: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredContas = contasPagar.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || conta.status === statusFilter;
    const matchesCategoria = categoriaFilter === 'todas' || conta.categoria_id === categoriaFilter;
    
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const totalPendente = contasPagar
    .filter(conta => conta.status === 'pendente')
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalPago = contasPagar
    .filter(conta => conta.status === 'pago')
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalVencido = contasPagar
    .filter(conta => conta.status === 'vencido')
    .reduce((sum, conta) => sum + conta.valor, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Gerencie todas as contas a pagar da instituição
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleProcessarContasRecorrentes}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Processar Recorrentes
          </Button>
          <Button 
            variant="outline" 
            onClick={handleGerarRelatorioPDF}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Relatório PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={handleGerarRelatorioCSV}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Relatório CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta a Pagar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatBrazilianCurrency(totalPendente)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBrazilianCurrency(totalPago)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatBrazilianCurrency(totalVencido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBrazilianCurrency(totalPendente + totalPago + totalVencido)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredContas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma conta encontrada
              </div>
            ) : (
              filteredContas.map((conta) => (
                <div key={conta.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{conta.descricao}</h3>
                      {getStatusBadge(getDisplayStatus(conta))}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatBrazilianCurrency(conta.valor)}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Venc: {formatBrazilianDate(conta.data_vencimento)}
                      </div>
                      
                      <div>
                        Fornecedor: {conta.fornecedor_nome}
                      </div>
                      
                      <div>
                        Categoria: {conta.categorias_financeiras.nome}
                      </div>
                    </div>

                    {/* Exibir próxima data de pagamento para contas recorrentes */}
                    {conta.recorrente && conta.frequencia_recorrencia && (
                      <div className="text-sm text-blue-600 mt-1">
                        Próximo pagamento ({conta.frequencia_recorrencia}): {
                          conta.data_proxima_geracao 
                            ? formatBrazilianDate(conta.data_proxima_geracao)
                            : formatBrazilianDate(calcularProximaDataPagamento(conta.data_vencimento, conta.frequencia_recorrencia))
                        }
                      </div>
                    )}

                    {conta.data_pagamento && (
                      <div className="text-sm text-green-600 mt-1">
                        Pago em: {formatBrazilianDate(conta.data_pagamento)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingConta(conta)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(conta.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <AddContaPagarModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchContasPagar();
        }}
        categorias={categorias.filter(c => c.tipo === 'despesa')}
      />

      {editingConta && (
        <EditContaPagarModal
          isOpen={!!editingConta}
          onClose={() => setEditingConta(null)}
          onSuccess={() => {
            setEditingConta(null);
            fetchContasPagar();
          }}
          conta={editingConta}
          categorias={categorias.filter(c => c.tipo === 'despesa')}
        />
      )}

      <Dialog open={showPDFModal} onOpenChange={setShowPDFModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Relatório PDF</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pdf-start">Data Início</Label>
                <Input
                  id="pdf-start"
                  type="date"
                  lang="pt-BR"
                  placeholder="dd/mm/aaaa"
                  value={pdfStartDate}
                  onChange={(e) => setPdfStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pdf-end">Data Fim</Label>
                <Input
                  id="pdf-end"
                  type="date"
                  lang="pt-BR"
                  placeholder="dd/mm/aaaa"
                  value={pdfEndDate}
                  onChange={(e) => setPdfEndDate(e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Se as datas não forem selecionadas, o relatório incluirá todos os registros filtrados na tela.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPDFModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarGeracaoPDF}>
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContasPagarPage;
