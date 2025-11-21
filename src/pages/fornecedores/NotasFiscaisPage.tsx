import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import DateInput from '@/components/ui/date-input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar,
  DollarSign,
  Building2,
  Filter,
  Download,
  Upload,
  Eye
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface NotaFiscal {
  id: string;
  numero: string;
  serie: string;
  fornecedor_id: string;
  fornecedor_nome?: string;
  data_emissao: string;
  data_vencimento: string;
  valor_total: number;
  valor_desconto?: number;
  valor_liquido: number;
  tipo: 'entrada' | 'saida';
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada';
  observacoes?: string;
  arquivo_url?: string;
  created_at: string;
  updated_at: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface NotaFiscalFormData {
  numero: string;
  serie: string;
  fornecedor_id: string;
  data_emissao: string;
  data_vencimento: string;
  valor_total: string;
  valor_desconto: string;
  tipo: 'entrada' | 'saida';
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada';
  observacoes: string;
}

const NotasFiscaisPage: React.FC = () => {
  const navigate = useNavigate();
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingNota, setViewingNota] = useState<NotaFiscal | null>(null);
  const [formData, setFormData] = useState<NotaFiscalFormData>({
    numero: '',
    serie: '',
    fornecedor_id: '',
    data_emissao: '',
    data_vencimento: '',
    valor_total: '',
    valor_desconto: '',
    tipo: 'entrada',
    status: 'pendente',
    observacoes: ''
  });

  useEffect(() => {
    fetchNotas();
    fetchFornecedores();
  }, []);

  const fetchNotas = async () => {
    try {
      const { data, error } = await supabase
        .from('notas_fiscais')
        .select(`
          *,
          fornecedores!inner(nome)
        `)
        .order('data_emissao', { ascending: false });

      if (error) throw error;

      const notasWithFornecedor = data?.map(nota => ({
        ...nota,
        fornecedor_nome: nota.fornecedores?.nome
      })) || [];

      setNotas(notasWithFornecedor);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
      toast.error('Erro ao carregar notas fiscais');
    } finally {
      setLoading(false);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const handleInputChange = (field: keyof NotaFiscalFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      serie: '',
      fornecedor_id: '',
      data_emissao: '',
      data_vencimento: '',
      valor_total: '',
      valor_desconto: '',
      tipo: 'entrada',
      status: 'pendente',
      observacoes: ''
    });
    setEditingNota(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero || !formData.fornecedor_id || !formData.data_emissao || !formData.valor_total) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const valorTotal = parseFloat(formData.valor_total);
      const valorDesconto = formData.valor_desconto ? parseFloat(formData.valor_desconto) : 0;
      const valorLiquido = valorTotal - valorDesconto;

      const notaData = {
        numero: formData.numero,
        serie: formData.serie,
        fornecedor_id: formData.fornecedor_id,
        data_emissao: formData.data_emissao,
        data_vencimento: formData.data_vencimento,
        valor_total: valorTotal,
        valor_desconto: valorDesconto > 0 ? valorDesconto : null,
        valor_liquido: valorLiquido,
        tipo: formData.tipo,
        status: formData.status,
        observacoes: formData.observacoes || null
      };

      let error;
      if (editingNota) {
        const { error: updateError } = await supabase
          .from('notas_fiscais')
          .update(notaData)
          .eq('id', editingNota.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('notas_fiscais')
          .insert([notaData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(editingNota ? 'Nota fiscal atualizada com sucesso!' : 'Nota fiscal criada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      fetchNotas();
    } catch (error) {
      console.error('Erro ao salvar nota fiscal:', error);
      toast.error('Erro ao salvar nota fiscal');
    }
  };

  const handleEdit = (nota: NotaFiscal) => {
    setEditingNota(nota);
    setFormData({
      numero: nota.numero,
      serie: nota.serie,
      fornecedor_id: nota.fornecedor_id,
      data_emissao: nota.data_emissao,
      data_vencimento: nota.data_vencimento,
      valor_total: nota.valor_total.toString(),
      valor_desconto: nota.valor_desconto?.toString() || '',
      tipo: nota.tipo,
      status: nota.status,
      observacoes: nota.observacoes || ''
    });
    setIsDialogOpen(true);
  };

  const handleView = (nota: NotaFiscal) => {
    setViewingNota(nota);
    setIsViewOpen(true);
  };

  const handleDelete = async (id: string, numero: string) => {
    try {
      const { error } = await supabase
        .from('notas_fiscais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(`Nota fiscal ${numero} excluída com sucesso!`);
      fetchNotas();
    } catch (error) {
      console.error('Erro ao excluir nota fiscal:', error);
      toast.error('Erro ao excluir nota fiscal');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: 'secondary' as const, label: 'Pendente' },
      paga: { variant: 'default' as const, label: 'Paga' },
      vencida: { variant: 'destructive' as const, label: 'Vencida' },
      cancelada: { variant: 'outline' as const, label: 'Cancelada' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge variant={tipo === 'entrada' ? 'default' : 'secondary'}>
        {tipo === 'entrada' ? 'Entrada' : 'Saída'}
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
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredNotas = notas.filter(nota => {
    const matchesSearch = nota.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nota.fornecedor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nota.serie.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || nota.status === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || nota.tipo === tipoFilter;

    return matchesSearch && matchesStatus && matchesTipo;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando notas fiscais...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Notas Fiscais
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie as notas fiscais dos fornecedores
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Nota Fiscal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNota ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
              </DialogTitle>
              <DialogDescription>
                {editingNota ? 'Atualize as informações da nota fiscal' : 'Preencha os dados da nova nota fiscal'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    placeholder="Número da nota fiscal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serie">Série</Label>
                  <Input
                    id="serie"
                    value={formData.serie}
                    onChange={(e) => handleInputChange('serie', e.target.value)}
                    placeholder="Série da nota fiscal"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                  <Select value={formData.fornecedor_id} onValueChange={(value) => handleInputChange('fornecedor_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_emissao">Data de Emissão *</Label>
                  <DateInput
                    id="data_emissao"
                    value={formData.data_emissao}
                    onChange={(value) => handleInputChange('data_emissao', value)}
                    required
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                  <DateInput
                    id="data_vencimento"
                    value={formData.data_vencimento}
                    onChange={(value) => handleInputChange('data_vencimento', value)}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total *</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => handleInputChange('valor_total', e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_desconto">Valor Desconto</Label>
                  <Input
                    id="valor_desconto"
                    type="number"
                    step="0.01"
                    value={formData.valor_desconto}
                    onChange={(e) => handleInputChange('valor_desconto', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida') => handleInputChange('tipo', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'pendente' | 'paga' | 'vencida' | 'cancelada') => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Observações sobre a nota fiscal"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingNota ? 'Atualizar' : 'Criar'} Nota Fiscal
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Visualizar Nota Fiscal</DialogTitle>
              <DialogDescription>Confira os detalhes da nota fiscal selecionada</DialogDescription>
            </DialogHeader>
            {viewingNota && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-medium">{viewingNota.numero}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Série</p>
                  <p className="font-medium">{viewingNota.serie || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{viewingNota.fornecedor_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">{formatDate(viewingNota.data_emissao)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                  <p className="font-medium">{viewingNota.data_vencimento ? formatDate(viewingNota.data_vencimento) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{viewingNota.tipo === 'entrada' ? 'Entrada' : 'Saída'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{viewingNota.status.charAt(0).toUpperCase() + viewingNota.status.slice(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-medium">{formatCurrency(viewingNota.valor_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Desconto</p>
                  <p className="font-medium">{viewingNota.valor_desconto ? formatCurrency(viewingNota.valor_desconto) : '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Valor Líquido</p>
                  <p className="font-medium">{formatCurrency(viewingNota.valor_liquido)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{viewingNota.observacoes || '-'}</p>
                </div>
                {viewingNota.arquivo_url && (
                  <div className="md:col-span-2">
                    <a href={viewingNota.arquivo_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Baixar Documento
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar notas fiscais..."
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
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
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
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('todos');
              setTipoFilter('todos');
            }}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notas List */}
      {filteredNotas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma nota fiscal encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira nota fiscal'}
              </p>
              {!searchTerm && statusFilter === 'todos' && tipoFilter === 'todos' && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Nota Fiscal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotas.map((nota) => (
            <Card key={nota.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      NF {nota.numero}
                      {nota.serie && ` - Série ${nota.serie}`}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {nota.fornecedor_nome}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(nota.status)}
                    {getTipoBadge(nota.tipo)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <strong>Emissão:</strong> {formatDate(nota.data_emissao)}
                  </div>
                  
                  {nota.data_vencimento && (
                    <div className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <strong>Vencimento:</strong> {formatDate(nota.data_vencimento)}
                    </div>
                  )}
                  
                  <div className="text-sm flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <strong>Valor:</strong> {formatCurrency(nota.valor_liquido)}
                  </div>
                  
                  {nota.observacoes && (
                    <div className="text-sm">
                      <strong>Obs:</strong> {nota.observacoes.substring(0, 50)}
                      {nota.observacoes.length > 50 && '...'}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(nota)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(nota)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a nota fiscal {nota.numero}?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(nota.id, nota.numero)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotasFiscaisPage;