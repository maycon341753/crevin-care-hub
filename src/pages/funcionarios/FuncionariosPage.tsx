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

// Mock data - será substituído por dados reais do banco
const funcionarios = [
  {
    id: 1,
    nome: "Maria Silva",
    cargo: "Técnica de Enfermagem",
    departamento: "Enfermagem",
    salario: 3500,
    status: "Ativo",
    admissao: "2023-02-15",
    telefone: "(61) 99999-1111",
    cpf: "123.456.789-01",
  },
  {
    id: 2,
    nome: "João Santos",
    cargo: "Cuidador",
    departamento: "Cuidados",
    salario: 2800,
    status: "Ativo",
    admissao: "2023-05-10",
    telefone: "(61) 99999-2222",
    cpf: "234.567.890-12",
  },
  {
    id: 3,
    nome: "Ana Costa",
    cargo: "Nutricionista",
    departamento: "Nutrição",
    salario: 4200,
    status: "Férias",
    admissao: "2022-08-03",
    telefone: "(61) 99999-3333",
    cpf: "345.678.901-23",
  },
  {
    id: 4,
    nome: "Carlos Oliveira",
    cargo: "Motorista",
    departamento: "Transporte",
    salario: 3000,
    status: "Ativo",
    admissao: "2023-01-20",
    telefone: "(61) 99999-4444",
    cpf: "456.789.012-34",
  },
];

export default function FuncionariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "Todos" || funcionario.departamento === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      "Ativo": "bg-success text-success-foreground",
      "Férias": "bg-warning text-warning-foreground",
      "Inativo": "bg-destructive text-destructive-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

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
          <Button className="bg-gradient-primary hover:bg-primary-hover">
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
                    <TableCell>{funcionario.departamento}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(funcionario.status)}>
                        {funcionario.status}
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {funcionario.salario.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(funcionario.admissao).toLocaleDateString('pt-BR')}
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
    </div>
  );
}