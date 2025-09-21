import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddFuncionarioModal } from "@/components/funcionarios/AddFuncionarioModal";
import { ViewFuncionarioModal } from "@/components/funcionarios/ViewFuncionarioModal";
import { EditFuncionarioModal } from "@/components/funcionarios/EditFuncionarioModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Funcionario } from "@/types";

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const { toast } = useToast();

  const fetchFuncionarios = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('funcionarios')
        .select(`
          *,
          departamentos (
            id,
            nome
          )
        `)
        .order('nome');

      if (error) throw error;

      setFuncionarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "inativo":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "ferias":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "afastado":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "inativo":
        return "Inativo";
      case "ferias":
        return "Férias";
      case "afastado":
        return "Afastado";
      default:
        return status;
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedFuncionario(null);
    fetchFuncionarios();
  };

  // Filtrar funcionários baseado na busca e departamento
  const handleViewFuncionario = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setIsViewModalOpen(true);
  };

  const handleEditFuncionario = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedFuncionario: Funcionario) => {
    fetchFuncionarios();
    console.log("Funcionário atualizado:", updatedFuncionario);
  };

  const filteredFuncionarios = funcionarios.filter((funcionario) => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.cpf.includes(searchTerm);
    
    const matchesDepartment = selectedDepartment === "Todos" || 
                             funcionario.departamento_id === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie funcionários e colaboradores da CREVIN
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-primary hover:bg-primary-hover" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionarios.length}</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Funcionários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {funcionarios.filter(f => f.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Férias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {funcionarios.filter(f => f.status === 'ferias').length}
            </div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Folha Salarial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {funcionarios.reduce((total, f) => total + (f.salario || 0), 0).toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="crevin-card">
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os funcionários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedDepartment}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedDepartment("Todos")}>
                    Todos os Departamentos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedDepartment("Enfermagem")}>
                    Enfermagem
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedDepartment("Cuidados")}>
                    Cuidados
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedDepartment("Nutrição")}>
                    Nutrição
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedDepartment("Transporte")}>
                    Transporte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Salário</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {searchTerm || selectedDepartment !== "Todos" 
                          ? "Nenhum funcionário encontrado com os filtros aplicados." 
                          : "Nenhum funcionário cadastrado."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFuncionarios.map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.cargo}</TableCell>
                    <TableCell>{funcionario.departamentos?.nome || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(funcionario.status)}>
                        {getStatusLabel(funcionario.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {funcionario.salario?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      {new Date(funcionario.data_admissao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewFuncionario(funcionario)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditFuncionario(funcionario)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar funcionário */}
      <AddFuncionarioModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleModalClose}
      />

      {/* Modal para visualizar funcionário */}
      <ViewFuncionarioModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        funcionario={selectedFuncionario}
      />

      {/* Modal para editar funcionário */}
      <EditFuncionarioModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        funcionario={selectedFuncionario}
        onSuccess={handleModalClose}
      />
    </div>
  );
}