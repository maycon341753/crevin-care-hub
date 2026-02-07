import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import DateSeparateInput from '@/components/ui/date-separate-input';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AddContaReceberModal from '@/components/financeiro/AddContaReceberModal';
import EditContaReceberModal from '@/components/financeiro/EditContaReceberModal';
import { formatBrazilianCurrency, formatBrazilianDate } from '@/lib/utils';

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
  pagador_cpf?: string;
  pagador_telefone?: string;
  forma_pagamento?: string;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
  observacoes?: string;
  categorias_financeiras: CategoriaFinanceira;
  recorrente?: boolean;
  frequencia_recorrencia?: string;
}

const ContasReceberPage = () => {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaReceber | null>(null);
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);
  const [relatorioStatus, setRelatorioStatus] = useState('todos');
  const [relatorioCategoria, setRelatorioCategoria] = useState('todas');
  const [relatorioInicio, setRelatorioInicio] = useState<string>(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd');
  });
  const [relatorioFim, setRelatorioFim] = useState<string>(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');
  });

  useEffect(() => {
    fetchContasReceber();
    fetchCategorias();
  }, []);

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
      toast.error('Erro ao carregar contas a receber');
      return;
    }

    setContasReceber(data || []);
    setLoading(false);
  };

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from('categorias_financeiras')
      .select('*')
      .eq('tipo', 'receita')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return;
    }

    setCategorias(data || []);
  };

  const handleDeleteConta = async (id: string) => {
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      recebido: { label: 'Recebido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: XCircle }
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

  const filteredContas = contasReceber.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.pagador_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || conta.status === statusFilter;
    const matchesCategoria = categoriaFilter === 'todas' || conta.categoria_id === categoriaFilter;
    
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const totalPendente = contasReceber
    .filter(conta => conta.status === 'pendente')
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalRecebido = contasReceber
    .filter(conta => conta.status === 'recebido')
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalVencido = contasReceber
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
          <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
          <p className="text-muted-foreground">
            Gerencie todas as contas a receber da instituição
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta a Receber
          </Button>
          <Button variant="outline" onClick={() => setShowRelatorioModal(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Relatório PDF
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
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBrazilianCurrency(totalRecebido)}
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
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBrazilianCurrency(totalPendente + totalRecebido + totalVencido)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou pagador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-[180px]">
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
          <CardTitle>Lista de Contas a Receber</CardTitle>
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
                      {getStatusBadge(conta.status)}
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
                        Pagador: {conta.pagador_nome || 'Não informado'}
                      </div>
                      
                      <div>
                        Categoria: {conta.categorias_financeiras.nome}
                      </div>
                    </div>

                    {conta.data_recebimento && (
                      <div className="text-sm text-green-600 mt-1">
                        Recebido em: {formatBrazilianDate(conta.data_recebimento)}
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
                      onClick={() => handleDeleteConta(conta.id)}
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
      {showAddModal && (
        <AddContaReceberModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchContasReceber();
          }}
          categorias={categorias}
        />
      )}

      {editingConta && (
        <EditContaReceberModal
          isOpen={!!editingConta}
          onClose={() => setEditingConta(null)}
          onSuccess={() => {
            setEditingConta(null);
            fetchContasReceber();
          }}
          conta={editingConta}
          categorias={categorias}
        />
      )}
      
      <Dialog open={showRelatorioModal} onOpenChange={setShowRelatorioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relatório de Contas a Receber</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={relatorioStatus} onValueChange={setRelatorioStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={relatorioCategoria} onValueChange={setRelatorioCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início</Label>
                <DateSeparateInput value={relatorioInicio} onChange={setRelatorioInicio} />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <DateSeparateInput value={relatorioFim} onChange={setRelatorioFim} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRelatorioModal(false)}>Cancelar</Button>
            <Button onClick={() => {
              const [iy, im, id] = relatorioInicio.split('-').map(Number);
              const [fy, fm, fd] = relatorioFim.split('-').map(Number);
              const inicio = new Date(iy, (im || 1) - 1, id || 1, 0, 0, 0, 0);
              const fim = new Date(fy, (fm || 1) - 1, fd || 1, 23, 59, 59, 999);
              const filtered = contasReceber.filter((conta) => {
                const byStatus = relatorioStatus === 'todos' || conta.status === relatorioStatus;
                const byCategoria = relatorioCategoria === 'todas' || conta.categoria_id === relatorioCategoria;
                const d = new Date(`${conta.data_vencimento}T00:00:00`);
                const byPeriodo = d >= inicio && d <= fim;
                return byStatus && byCategoria && byPeriodo;
              });
              const total = filtered.reduce((sum, c) => sum + c.valor, 0);
              const doc = new jsPDF();
              doc.setFontSize(20);
              doc.text('Relatório - Contas a Receber', 20, 20);
              doc.setFontSize(12);
              doc.text(`${format(inicio, 'dd/MM/yyyy')} - ${format(fim, 'dd/MM/yyyy')}`, 20, 30);
              doc.setFontSize(14);
              doc.text('Resumo', 20, 50);
              doc.setFontSize(10);
              doc.text(`Total do período: ${formatBrazilianCurrency(total)}`, 20, 60);
              const tableData = filtered.map((conta) => [
                conta.descricao,
                formatBrazilianCurrency(conta.valor),
                formatBrazilianDate(conta.data_vencimento),
                conta.categorias_financeiras?.nome || '',
                conta.status
              ]);
              autoTable(doc, {
                head: [['Descrição', 'Valor', 'Vencimento', 'Categoria', 'Status']],
                body: tableData,
                startY: 75,
                styles: { fontSize: 8 }
              });
              const pageCount = doc.getNumberOfPages();
              for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Página ${i} de ${pageCount}`, 20, doc.internal.pageSize.height - 10);
                doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 120, doc.internal.pageSize.height - 10);
              }
              doc.save(`contas-receber-${format(inicio, 'yyyyMMdd')}-${format(fim, 'yyyyMMdd')}.pdf`);
              setShowRelatorioModal(false);
              toast.success('Relatório PDF gerado com sucesso');
            }}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContasReceberPage;
