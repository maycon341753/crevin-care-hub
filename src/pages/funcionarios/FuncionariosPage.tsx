import { useState } from "react";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
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
import { Funcionario } from "@/types";

// Mock data - será substituído por dados reais do banco
const funcionarios: Funcionario[] = [
  {
    id: "1",
    nome: "Maria Silva",
    cpf: "123.456.789-01",
    telefone: "(61) 99999-1111",
    email: "maria.silva@crevin.com",
    cargo: "Técnica de Enfermagem",
    departamento_id: "dept-1",
    salario: 3500,
    data_admissao: "2023-02-15",
    status: "ativo",
    created_at: "2023-02-15T00:00:00Z",
    updated_at: "2023-02-15T00:00:00Z",
    created_by: "user-1"
  },
  {
    id: "2",
    nome: "João Santos",
    cpf: "234.567.890-12",
    telefone: "(61) 99999-2222",
    email: "joao.santos@crevin.com",
    cargo: "Cuidador",
    departamento_id: "dept-2",
    salario: 2800,
    data_admissao: "2023-05-10",
    status: "ativo",
    created_at: "2023-05-10T00:00:00Z",
    updated_at: "2023-05-10T00:00:00Z",
    created_by: "user-1"
  },
  {
    id: "3",
    nome: "Ana Costa",
    cpf: "345.678.901-23",
    telefone: "(61) 99999-3333",
    email: "ana.costa@crevin.com",
    cargo: "Nutricionista",
    departamento_id: "dept-3",
    salario: 4200,
    data_admissao: "2022-08-03",
    status: "ferias",
    created_at: "2022-08-03T00:00:00Z",
    updated_at: "2022-08-03T00:00:00Z",
    created_by: "user-1"
  },
  {
    id: "4",
    nome: "Carlos Oliveira",
    cpf: "456.789.012-34",
    telefone: "(61) 99999-4444",
    email: "carlos.oliveira@crevin.com",
    cargo: "Motorista",
    departamento_id: "dept-4",
    salario: 2500,
    data_admissao: "2023-01-20",
    status: "ativo",
    created_at: "2023-01-20T00:00:00Z",
    updated_at: "2023-01-20T00:00:00Z",
    created_by: "user-1"
  },
];

export default function FuncionariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  // Filtrar funcionários baseado na busca e departamento
  const filteredFuncionarios = funcionarios.filter((funcionario) => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.cpf.includes(searchTerm);
    
    const matchesDepartment = selectedDepartment === "Todos" || 
                             funcionario.departamento_id === selectedDepartment; // Será ajustado quando integrar com dados reais
    
    return matchesSearch && matchesDepartment;
  });

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
            <div className="text-2xl font-bold">47</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Funcionários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">43</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Férias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">3</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Folha Salarial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 164.700</div>
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
                {filteredFuncionarios.map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.cargo}</TableCell>
                    <TableCell>Departamento</TableCell> {/* Será substituído por lookup real */}
                    <TableCell>
                      <Badge className={getStatusBadge(funcionario.status)}>
                        {getStatusLabel(funcionario.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {funcionario.salario.toLocaleString()}</TableCell>
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar funcionário */}
      <AddFuncionarioModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          // Aqui você pode recarregar a lista de funcionários
          // Por enquanto, apenas fechamos o modal
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
}