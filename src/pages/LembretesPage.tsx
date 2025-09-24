import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Bell, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatBrazilianDate } from "@/lib/utils";
import AddLembreteModal from "@/components/lembretes/AddLembreteModal";
import EditLembreteModal from "@/components/lembretes/EditLembreteModal";
import DeleteLembreteModal from "@/components/lembretes/DeleteLembreteModal";

interface Lembrete {
  id: string;
  titulo: string;
  descricao?: string;
  data_lembrete: string;
  hora_lembrete?: string;
  tipo: 'geral' | 'medicamento' | 'consulta' | 'atividade' | 'alimentacao' | 'outro';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'concluido' | 'cancelado';
  funcionario_id?: string;
  idoso_id?: string;
  criado_por?: string;
  observacoes?: string;
  notificado: boolean;
  data_notificacao?: string;
  recorrente: boolean;
  tipo_recorrencia?: 'diario' | 'semanal' | 'mensal' | 'anual';
  created_at: string;
  updated_at: string;
  funcionario?: {
    nome: string;
    cargo?: string;
  };
  idoso?: {
    nome: string;
  };
  criador?: {
    nome: string;
  };
}

export default function LembretesPage() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterPrioridade, setFilterPrioridade] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLembrete, setSelectedLembrete] = useState<Lembrete | null>(null);
  const { toast } = useToast();

  const fetchLembretes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lembretes')
        .select(`
          *,
          funcionario:funcionarios!funcionario_id(nome, cargo),
          idoso:idosos!idoso_id(nome),
          criador:funcionarios!criado_por(nome)
        `)
        .order('data_lembrete', { ascending: true });

      if (error) {
        console.error('Erro ao buscar lembretes:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os lembretes.",
          variant: "destructive",
        });
        return;
      }

      setLembretes(data || []);
    } catch (error) {
      console.error('Erro ao buscar lembretes:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar lembretes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLembretes();
  }, [fetchLembretes]);

  const handleEdit = (lembrete: Lembrete) => {
    setSelectedLembrete(lembrete);
    setEditModalOpen(true);
  };

  const handleDelete = (lembrete: Lembrete) => {
    setSelectedLembrete(lembrete);
    setDeleteModalOpen(true);
  };

  const handleStatusChange = async (lembreteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('lembretes')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', lembreteId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o status do lembrete.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Status do lembrete atualizado com sucesso!",
      });

      fetchLembretes();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar status.",
        variant: "destructive",
      });
    }
  };

  const filteredLembretes = lembretes.filter(lembrete => {
    const matchesSearch = lembrete.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lembrete.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lembrete.funcionario?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lembrete.idoso?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === "todos" || lembrete.tipo === filterTipo;
    const matchesPrioridade = filterPrioridade === "todos" || lembrete.prioridade === filterPrioridade;
    const matchesStatus = filterStatus === "todos" || lembrete.status === filterStatus;

    return matchesSearch && matchesTipo && matchesPrioridade && matchesStatus;
  });

  const getTipoBadge = (tipo: string) => {
    const badges = {
      geral: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      medicamento: "bg-red-100 text-red-800 hover:bg-red-200",
      consulta: "bg-green-100 text-green-800 hover:bg-green-200",
      atividade: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      alimentacao: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      outro: "bg-gray-100 text-gray-800 hover:bg-gray-200"
    };
    return badges[tipo as keyof typeof badges] || badges.outro;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges = {
      baixa: "bg-green-100 text-green-800 hover:bg-green-200",
      media: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      alta: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      urgente: "bg-red-100 text-red-800 hover:bg-red-200"
    };
    return badges[prioridade as keyof typeof badges] || badges.media;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      concluido: "bg-green-100 text-green-800 hover:bg-green-200",
      cancelado: "bg-red-100 text-red-800 hover:bg-red-200"
    };
    return badges[status as keyof typeof badges] || badges.pendente;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pendente: <Clock className="h-3 w-3" />,
      concluido: <CheckCircle className="h-3 w-3" />,
      cancelado: <XCircle className="h-3 w-3" />
    };
    return icons[status as keyof typeof icons] || icons.pendente;
  };

  const getPrioridadeIcon = (prioridade: string) => {
    const icons = {
      baixa: <CheckCircle className="h-3 w-3" />,
      media: <Clock className="h-3 w-3" />,
      alta: <AlertTriangle className="h-3 w-3" />,
      urgente: <AlertTriangle className="h-3 w-3" />
    };
    return icons[prioridade as keyof typeof icons] || icons.media;
  };

  // Estatísticas
  const totalLembretes = lembretes.length;
  const lembretesPendentes = lembretes.filter(l => l.status === 'pendente').length;
  const lembretesConcluidos = lembretes.filter(l => l.status === 'concluido').length;
  const lembretesUrgentes = lembretes.filter(l => l.prioridade === 'urgente' && l.status === 'pendente').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lembretes</h1>
          <p className="text-muted-foreground">
            Gerencie lembretes e alertas do sistema
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lembrete
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lembretes</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLembretes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lembretesPendentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{lembretesConcluidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lembretesUrgentes}</div>
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
                  placeholder="Buscar lembretes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="medicamento">Medicamento</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="atividade">Atividade</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Lembretes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Lembretes</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os lembretes cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLembretes.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterTipo !== "todos" || filterPrioridade !== "todos" || filterStatus !== "todos"
                  ? "Nenhum lembrete encontrado com os filtros aplicados."
                  : "Nenhum lembrete cadastrado ainda."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLembretes.map((lembrete) => (
                  <TableRow key={lembrete.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lembrete.titulo}</div>
                        {lembrete.descricao && (
                          <div className="text-sm text-muted-foreground max-w-xs truncate" title={lembrete.descricao}>
                            {lembrete.descricao}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">{formatBrazilianDate(lembrete.data_lembrete)}</span>
                      </div>
                      {lembrete.hora_lembrete && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm text-muted-foreground">{lembrete.hora_lembrete}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoBadge(lembrete.tipo)}>
                        {lembrete.tipo.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPrioridadeBadge(lembrete.prioridade)}>
                        <div className="flex items-center gap-1">
                          {getPrioridadeIcon(lembrete.prioridade)}
                          {lembrete.prioridade.toUpperCase()}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lembrete.status}
                        onValueChange={(value) => handleStatusChange(lembrete.id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <Badge className={getStatusBadge(lembrete.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(lembrete.status)}
                              {lembrete.status.toUpperCase()}
                            </div>
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lembrete.funcionario?.nome || lembrete.idoso?.nome || 'N/A'}
                      </div>
                      {lembrete.criador && (
                        <div className="text-xs text-muted-foreground">
                          Criado por: {lembrete.criador.nome}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(lembrete)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lembrete)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <AddLembreteModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={fetchLembretes}
      />

      {selectedLembrete && (
        <>
          <EditLembreteModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            lembrete={selectedLembrete}
            onSuccess={fetchLembretes}
          />

          <DeleteLembreteModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            lembrete={selectedLembrete}
            onSuccess={fetchLembretes}
          />
        </>
      )}
    </div>
  );
}