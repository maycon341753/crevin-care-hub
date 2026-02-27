import { useState, useEffect } from "react";
import { Plus, Search, Heart, Calendar, Activity, Stethoscope, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatBrazilianDate } from "@/lib/utils";
import { AddMedicoModal } from "@/components/medico/AddMedicoModal";
import { EditMedicoModal } from "@/components/medico/EditMedicoModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface MedicoIdoso {
  id: string;
  idoso_id: string;
  tipo_registro: 'consulta' | 'exame' | 'medicamento' | 'procedimento' | 'observacao';
  data_registro: string;
  hora_registro?: string;
  descricao: string;
  medico_responsavel?: string;
  especialidade?: string;
  resultado?: string;
  observacoes?: string;
  status: 'ativo' | 'cancelado' | 'concluido';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  created_at: string;
  updated_at: string;
  idosos?: {
    nome: string;
  };
}

export default function MedicoPage() {
  const [registrosMedico, setRegistrosMedico] = useState<MedicoIdoso[]>([]);
  const [filteredRegistros, setFilteredRegistros] = useState<MedicoIdoso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [prioridadeFilter, setPrioridadeFilter] = useState("todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<MedicoIdoso | null>(null);
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Função para buscar registros médicos
  const fetchRegistrosMedico = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saude_idosos')
        .select(`
          *,
          idosos (
            nome
          )
        `)
        .order('data_registro', { ascending: false });

      if (error) throw error;

      setRegistrosMedico(data || []);
    } catch (error) {
      console.error('Erro ao buscar registros médicos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros médicos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar registro
  const handleDelete = async (id: string) => {
    

    try {
      const { error } = await supabase
        .from('saude_idosos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso!",
      });

      fetchRegistrosMedico();
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro.",
        variant: "destructive",
      });
    }
  };

  // Função para filtrar registros
  const filterRegistros = () => {
    let filtered = registrosMedico;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(registro =>
        registro.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.idosos?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.medico_responsavel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (tipoFilter !== "todos") {
      filtered = filtered.filter(registro => registro.tipo_registro === tipoFilter);
    }

    // Filtro por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter(registro => registro.status === statusFilter);
    }

    // Filtro por prioridade
    if (prioridadeFilter !== "todos") {
      filtered = filtered.filter(registro => registro.prioridade === prioridadeFilter);
    }

    setFilteredRegistros(filtered);
  };

  // Função para obter cor do badge baseado no tipo
  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'consulta': return 'bg-blue-100 text-blue-800';
      case 'exame': return 'bg-green-100 text-green-800';
      case 'medicamento': return 'bg-purple-100 text-purple-800';
      case 'procedimento': return 'bg-orange-100 text-orange-800';
      case 'observacao': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter cor do badge baseado no status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-blue-100 text-blue-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter cor do badge baseado na prioridade
  const getPrioridadeBadgeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'alta': return 'bg-yellow-100 text-yellow-800';
      case 'urgente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calcular estatísticas
  const totalRegistros = registrosMedico.length;
  const consultasHoje = registrosMedico.filter(r => 
    r.tipo_registro === 'consulta' && 
    new Date(r.data_registro).toDateString() === new Date().toDateString()
  ).length;
  const examesPendentes = registrosMedico.filter(r => 
    r.tipo_registro === 'exame' && 
    r.status === 'ativo'
  ).length;
  const registrosUrgentes = registrosMedico.filter(r => 
    r.prioridade === 'urgente' && 
    r.status === 'ativo'
  ).length;

  useEffect(() => {
    fetchRegistrosMedico();
  }, []);

  useEffect(() => {
    filterRegistros();
  }, [registrosMedico, searchTerm, tipoFilter, statusFilter, prioridadeFilter]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Médico dos Idosos</h1>
          <p className="text-gray-600 mt-1">Gerencie consultas, exames e cuidados médicos</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Registro
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistros}</div>
            <p className="text-xs text-muted-foreground">Registros médicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasHoje}</div>
            <p className="text-xs text-muted-foreground">Agendadas para hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exames Pendentes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examesPendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando resultado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{registrosUrgentes}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre os registros médicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por descrição, idoso, médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Registro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="consulta">Consulta</SelectItem>
                <SelectItem value="exame">Exame</SelectItem>
                <SelectItem value="medicamento">Medicamento</SelectItem>
                <SelectItem value="procedimento">Procedimento</SelectItem>
                <SelectItem value="observacao">Observação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setTipoFilter("todos");
                setStatusFilter("todos");
                setPrioridadeFilter("todos");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Médicos</CardTitle>
          <CardDescription>
            {filteredRegistros.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Idoso</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatBrazilianDate(registro.data_registro)}
                        </div>
                        {registro.hora_registro && (
                          <div className="text-sm text-gray-500">
                            {registro.hora_registro}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {registro.idosos?.nome}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoBadgeColor(registro.tipo_registro)}>
                        {registro.tipo_registro}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium">{registro.descricao}</div>
                        {registro.especialidade && (
                          <div className="text-sm text-gray-500">
                            {registro.especialidade}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{registro.medico_responsavel || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(registro.status)}>
                        {registro.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPrioridadeBadgeColor(registro.prioridade)}>
                        {registro.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRegistro(registro);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setDeleteTargetId(registro.id); setDeleteConfirmOpen(true); }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRegistros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <AddMedicoModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={fetchRegistrosMedico}
      />

      <EditMedicoModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        registro={selectedRegistro}
        onSuccess={fetchRegistrosMedico}
      />
    
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!deleteTargetId) return;
              await handleDelete(deleteTargetId);
              setDeleteConfirmOpen(false);
              setDeleteTargetId(null);
            }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
</div>
  );
}