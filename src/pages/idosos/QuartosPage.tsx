import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Quarto } from "@/types/quarto";
import { AddQuartoModal } from "@/components/quartos/AddQuartoModal";
import { EditQuartoModal } from "@/components/quartos/EditQuartoModal";
import { Plus, Edit, Trash2, Search, Users, Bed, Home, Eye } from "lucide-react";
import { ViewQuartoModal } from "@/components/quartos/ViewQuartoModal";

export default function QuartosPage() {
  const [quartos, setQuartos] = useState<Quarto[]>([]);
  const [filteredQuartos, setFilteredQuartos] = useState<Quarto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuarto, setSelectedQuarto] = useState<Quarto | null>(null);
  const { toast } = useToast();

  // Função para buscar quartos
  const fetchQuartos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quartos')
        .select('*')
        .order('numero', { ascending: true });

      if (error) throw error;

      setQuartos(data || []);
    } catch (error) {
      console.error('Erro ao buscar quartos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os quartos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar quartos
  useEffect(() => {
    let filtered = quartos;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(quarto =>
        quarto.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quarto.ala && quarto.ala.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (quarto.descricao && quarto.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter(quarto => quarto.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== "todos") {
      filtered = filtered.filter(quarto => quarto.tipo === tipoFilter);
    }

    setFilteredQuartos(filtered);
  }, [quartos, searchTerm, statusFilter, tipoFilter]);

  // Carregar quartos ao montar o componente
  useEffect(() => {
    fetchQuartos();
  }, []);

  // Função para deletar quarto
  const handleDeleteQuarto = async (quarto: Quarto) => {
    if (!confirm(`Tem certeza que deseja excluir o quarto ${quarto.numero}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quartos')
        .delete()
        .eq('id', quarto.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Quarto excluído com sucesso!",
      });

      fetchQuartos();
    } catch (error) {
      console.error('Erro ao excluir quarto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o quarto.",
        variant: "destructive",
      });
    }
  };

  // Função para abrir modal de edição
  const handleEditQuarto = (quarto: Quarto) => {
    setSelectedQuarto(quarto);
    setShowEditModal(true);
  };

  const handleViewQuarto = (quarto: Quarto) => {
    setSelectedQuarto(quarto);
    setShowViewModal(true);
  };

  // Função para fechar modais e recarregar dados
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedQuarto(null);
    fetchQuartos();
  };

  // Funções auxiliares para exibição
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'ocupado':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'manutencao':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'inativo':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'ocupado':
        return 'Ocupado';
      case 'manutencao':
        return 'Manutenção';
      case 'inativo':
        return 'Inativo';
      default:
        return status;
    }
  };

  const getTipoText = (tipo: string) => {
    switch (tipo) {
      case 'individual':
        return 'Individual';
      case 'duplo':
        return 'Duplo';
      case 'coletivo':
        return 'Coletivo';
      case 'quarto':
        return 'Quarto';
      default:
        return tipo;
    }
  };

  // Estatísticas
  const totalQuartos = quartos.length;
  const quartosDisponiveis = quartos.filter(q => q.status === 'disponivel').length;
  const quartosOcupados = quartos.filter(q => q.status === 'ocupado').length;
  const quartosManutencao = quartos.filter(q => q.status === 'manutencao').length;
  const capacidadeTotal = quartos.reduce((acc, q) => acc + q.capacidade, 0);
  const ocupacaoTotal = quartos.reduce((acc, q) => acc + (q.ocupacao_atual || 0), 0);
  const taxaOcupacao = capacidadeTotal > 0 ? Math.round((ocupacaoTotal / capacidadeTotal) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quartos e Alas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie os quartos e alas da instituição
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Quarto
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Quartos</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalQuartos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quartos Disponíveis</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{quartosDisponiveis}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quartos Ocupados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{quartosOcupados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{taxaOcupacao}%</div>
            <p className="text-xs text-muted-foreground">
              {ocupacaoTotal} de {capacidadeTotal} vagas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Quartos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os quartos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, ala, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="duplo">Duplo</SelectItem>
                  <SelectItem value="coletivo">Coletivo</SelectItem>
                  <SelectItem value="quarto">Quarto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Número</TableHead>
                  <TableHead className="min-w-[120px]">Ala</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[100px]">Tipo</TableHead>
                  <TableHead className="min-w-[100px]">Capacidade</TableHead>
                  <TableHead className="min-w-[100px]">Ocupação</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[80px]">Andar</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[150px]">Descrição</TableHead>
                  <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuartos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum quarto encontrado." : "Nenhum quarto cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuartos.map((quarto) => (
                    <TableRow key={quarto.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          {quarto.numero}
                        </div>
                      </TableCell>
                      <TableCell>{quarto.ala}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getTipoText(quarto.tipo)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {quarto.capacidade}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${quarto.ocupacao_atual > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                            {quarto.ocupacao_atual}/{quarto.capacidade}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(quarto.status)}>
                          {getStatusText(quarto.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {quarto.andar ? `${quarto.andar}º` : '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {quarto.descricao ? (
                          <span className="truncate max-w-[150px] block" title={quarto.descricao}>
                            {quarto.descricao}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewQuarto(quarto)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditQuarto(quarto)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuarto(quarto)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* Modais */}
    <AddQuartoModal
      open={showAddModal}
      onClose={handleCloseModal}
    />

    {selectedQuarto && (
      <ViewQuartoModal
        open={showViewModal}
        onClose={handleCloseModal}
        quarto={selectedQuarto}
      />
    )}

    {selectedQuarto && (
      <EditQuartoModal
        open={showEditModal}
        onClose={handleCloseModal}
        quarto={selectedQuarto}
      />
    )}
  </div>
  );
}
