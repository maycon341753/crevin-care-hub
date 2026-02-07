import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Filter
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

interface Fornecedor {
  id: string;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  cpf?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  categoria?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  created_at: string;
  updated_at: string;
}

const FornecedoresPage: React.FC = () => {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [tipoFilter, setTipoFilter] = useState('todos');

  const categorias = [
    'alimentacao',
    'limpeza', 
    'medicamentos',
    'servicos',
    'manutencao',
    'equipamentos',
    'outros'
  ];

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const fetchFornecedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar fornecedores:', error);
        toast.error('Erro ao carregar fornecedores');
        return;
      }

      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    try {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir fornecedor:', error);
        toast.error('Erro ao excluir fornecedor: ' + error.message);
        return;
      }

      toast.success(`Fornecedor "${nome}" excluído com sucesso!`);
      fetchFornecedores();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao excluir fornecedor');
    }
  };

  const toggleStatus = async (fornecedor: Fornecedor) => {
    const newStatus = fornecedor.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({ status: newStatus })
        .eq('id', fornecedor.id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status do fornecedor');
        return;
      }

      toast.success(`Status do fornecedor "${fornecedor.nome}" alterado para ${newStatus}`);
      fetchFornecedores();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao atualizar status');
    }
  };

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.cnpj?.includes(searchTerm) ||
                         fornecedor.cpf?.includes(searchTerm) ||
                         fornecedor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || fornecedor.status === statusFilter;
    const matchesCategoria = categoriaFilter === 'todas' || fornecedor.categoria === categoriaFilter;
    const matchesTipo = tipoFilter === 'todos' || fornecedor.tipo_pessoa === tipoFilter;

    return matchesSearch && matchesStatus && matchesCategoria && matchesTipo;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-gray-100 text-gray-800',
      bloqueado: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge variant={tipo === 'juridica' ? 'default' : 'secondary'}>
        {tipo === 'juridica' ? 'Jurídica' : 'Física'}
      </Badge>
    );
  };

  const formatDocument = (fornecedor: Fornecedor) => {
    if (fornecedor.tipo_pessoa === 'juridica' && fornecedor.cnpj) {
      return fornecedor.cnpj;
    }
    if (fornecedor.tipo_pessoa === 'fisica' && fornecedor.cpf) {
      return fornecedor.cpf;
    }
    return 'Não informado';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando fornecedores...</div>
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
            <Building2 className="h-6 w-6" />
            Fornecedores
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os fornecedores da instituição
          </p>
        </div>
        <Button 
          onClick={() => navigate('/fornecedores/novo')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar fornecedores..."
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
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
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
                <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                <SelectItem value="fisica">Pessoa Física</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setCategoriaFilter('todas');
                setTipoFilter('todos');
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Mostrando {filteredFornecedores.length} de {fornecedores.length} fornecedores
        </p>
      </div>

      {/* Fornecedores Grid */}
      {filteredFornecedores.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum fornecedor encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'todos' || categoriaFilter !== 'todas' || tipoFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece cadastrando seu primeiro fornecedor'
                }
              </p>
              {!searchTerm && statusFilter === 'todos' && categoriaFilter === 'todas' && tipoFilter === 'todos' && (
                <Button onClick={() => navigate('/fornecedores/novo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Fornecedor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFornecedores.map((fornecedor) => (
            <Card key={fornecedor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      {fornecedor.tipo_pessoa === 'juridica' ? (
                        <Building2 className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      {fornecedor.nome}
                    </CardTitle>
                    {fornecedor.razao_social && (
                      <p className="text-sm text-gray-600 mb-2">
                        {fornecedor.razao_social}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(fornecedor.status)}
                    {getTipoBadge(fornecedor.tipo_pessoa)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <strong>Documento:</strong> {formatDocument(fornecedor)}
                  </div>
                  
                  {fornecedor.categoria && (
                    <div className="text-sm">
                      <strong>Categoria:</strong> {fornecedor.categoria.charAt(0).toUpperCase() + fornecedor.categoria.slice(1)}
                    </div>
                  )}
                  
                  {fornecedor.email && (
                    <div className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {fornecedor.email}
                    </div>
                  )}
                  
                  {(fornecedor.telefone || fornecedor.celular) && (
                    <div className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {fornecedor.celular || fornecedor.telefone}
                    </div>
                  )}
                  
                  {(fornecedor.cidade || fornecedor.estado) && (
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[fornecedor.cidade, fornecedor.estado].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/fornecedores/editar/${fornecedor.id}`)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={fornecedor.status === 'ativo' ? 'secondary' : 'default'}
                      onClick={() => toggleStatus(fornecedor)}
                    >
                      {fornecedor.status === 'ativo' ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o fornecedor "{fornecedor.nome}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(fornecedor.id, fornecedor.nome)}
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

export default FornecedoresPage;