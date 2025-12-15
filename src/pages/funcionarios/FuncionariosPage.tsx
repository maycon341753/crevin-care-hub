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
import { formatBrazilianSalary, formatBrazilianDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  // Debug: Log do estado do modal
  useEffect(() => {
    console.log('Estado do modal de edição mudou:', isEditModalOpen);
    console.log('Funcionário selecionado:', selectedFuncionario);
  }, [isEditModalOpen, selectedFuncionario]);

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
    console.log('handleEditFuncionario chamado com:', funcionario);
    console.log('Estado atual do modal antes:', isEditModalOpen);
    setSelectedFuncionario(funcionario);
    setIsEditModalOpen(true);
    console.log('Modal deveria estar aberto agora');
  };

  const handleEditSuccess = (updatedFuncionario: Funcionario) => {
    fetchFuncionarios();
    setIsEditModalOpen(false);
    setSelectedFuncionario(null);
    console.log("Funcionário atualizado:", updatedFuncionario);
  };

  const handleDeleteFuncionario = async (funcionario: Funcionario) => {
    if (!confirm(`Tem certeza que deseja excluir o funcionário ${funcionario.nome}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', funcionario.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso.",
      });

      fetchFuncionarios();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o funcionário.",
        variant: "destructive",
      });
    }
  };

  const filteredFuncionarios = funcionarios.filter((funcionario) => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.cpf.includes(searchTerm);
    
    const matchesDepartment = selectedDepartment === "Todos" || 
                             funcionario.departamento_id === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const titulo = "Lista de Funcionários";
      doc.setFontSize(16);
      doc.text(titulo, 14, 20);

      const head = [["Nome", "Cargo", "Departamento", "Status", "Admissão", "Salário"]];
      const body = filteredFuncionarios.map((f) => [
        f.nome,
        f.cargo,
        f.departamentos?.nome || "N/A",
        getStatusLabel(f.status),
        formatBrazilianDate(f.data_admissao),
        f.salario ? `R$ ${formatBrazilianSalary(f.salario)}` : "-"
      ]);

      autoTable(doc, {
        head,
        body,
        startY: 26,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 163, 74] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
        },
      });

      const data = new Date();
      const nomeArquivo = `funcionarios_${String(data.getFullYear())}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}.pdf`;
      doc.save(nomeArquivo);
      toast({ title: "PDF gerado", description: "Download concluído com sucesso." });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ title: "Erro", description: "Não foi possível gerar o PDF.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie os funcionários da instituição
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleDownloadPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{funcionarios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {funcionarios.filter(f => f.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Férias</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {funcionarios.filter(f => f.status === 'ferias').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afastados</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {funcionarios.filter(f => f.status === 'afastado').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Lista de Funcionários</CardTitle>
          <CardDescription className="text-sm">
            Visualize e gerencie todos os funcionários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 flex-1">
              <div className="relative flex-1 max-w-full sm:max-w-sm">
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
                  <Button variant="outline" className="w-full sm:w-auto justify-between">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <span className="truncate">{selectedDepartment}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Nome</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Cargo</TableHead>
                  <TableHead className="min-w-[120px] hidden sm:table-cell">Departamento</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[100px] hidden md:table-cell">Salário</TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Admissão</TableHead>
                  <TableHead className="text-right min-w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchTerm || selectedDepartment !== "Todos" 
                          ? "Nenhum funcionário encontrado com os filtros aplicados." 
                          : "Nenhum funcionário cadastrado."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFuncionarios.map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-medium">{funcionario.nome}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {funcionario.cargo} • {funcionario.departamentos?.nome || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{funcionario.cargo}</TableCell>
                    <TableCell className="hidden sm:table-cell">{funcionario.departamentos?.nome || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(funcionario.status)}>
                        {getStatusLabel(funcionario.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {funcionario.salario ? `R$ ${formatBrazilianSalary(funcionario.salario)}` : '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatBrazilianDate(funcionario.data_admissao)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewFuncionario(funcionario)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditFuncionario(funcionario)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFuncionario(funcionario)}>
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
        onOpenChange={(open) => {
          console.log('EditFuncionarioModal onOpenChange chamado com:', open);
          setIsEditModalOpen(open);
          if (!open) {
            setSelectedFuncionario(null);
          }
        }}
        funcionario={selectedFuncionario}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
