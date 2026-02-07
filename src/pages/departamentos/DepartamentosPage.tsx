import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatBrazilianDate } from "@/lib/utils";
import { Departamento } from "@/types";
import { AddDepartamentoModal } from "@/components/departamentos/AddDepartamentoModal";
import { EditDepartamentoModal } from "@/components/departamentos/EditDepartamentoModal";
import { DeleteDepartamentoModal } from "@/components/departamentos/DeleteDepartamentoModal";

interface DepartamentoWithCount extends Departamento {
  _count?: {
    funcionarios: number;
  };
}

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<DepartamentoWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartamento, setSelectedDepartamento] = useState<DepartamentoWithCount | null>(null);
  const { toast } = useToast();

  const fetchDepartamentos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar departamentos com contagem de funcionários
      const { data: departamentosData, error: departamentosError } = await supabase
        .from('departamentos')
        .select('*')
        .order('nome');

      if (departamentosError) throw departamentosError;

      // Buscar contagem de funcionários para cada departamento
      const departamentosWithCount = await Promise.all(
        (departamentosData || []).map(async (dept) => {
          const { count } = await supabase
            .from('funcionarios')
            .select('*', { count: 'exact', head: true })
            .eq('departamento_id', dept.id);
          
          return {
            ...dept,
            _count: {
              funcionarios: count || 0
            }
          };
        })
      );

      setDepartamentos(departamentosWithCount);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os departamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDepartamentos();
  }, [fetchDepartamentos]);

  const filteredDepartamentos = departamentos.filter(dept =>
    dept.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.descricao && dept.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (departamento: Departamento) => {
    setSelectedDepartamento(departamento);
    setShowEditModal(true);
  };

  const handleDelete = (departamento: Departamento) => {
    setSelectedDepartamento(departamento);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedDepartamento(null);
    fetchDepartamentos();
  };

  const getStatusBadge = (ativo: boolean) => {
    return ativo 
      ? "bg-green-100 text-green-800 hover:bg-green-100" 
      : "bg-red-100 text-red-800 hover:bg-red-100";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Departamentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie os departamentos da organização
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Departamento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Departamentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{departamentos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {departamentos.filter(d => d.ativo).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {departamentos.reduce((total, d) => total + (d._count?.funcionarios || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Depto</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {departamentos.length > 0 
                ? Math.round(departamentos.reduce((total, d) => total + (d._count?.funcionarios || 0), 0) / departamentos.length)
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Lista de Departamentos</CardTitle>
          <CardDescription className="text-sm">
            Visualize e gerencie todos os departamentos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 mb-4">
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar departamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Nome</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[150px]">Descrição</TableHead>
                  <TableHead className="min-w-[100px]">Funcionários</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[100px]">Criado em</TableHead>
                  <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchTerm ? "Nenhum departamento encontrado." : "Nenhum departamento cadastrado."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartamentos.map((departamento) => (
                    <TableRow key={departamento.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[120px] truncate" title={departamento.nome}>
                          {departamento.nome}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="max-w-[150px] truncate" title={departamento.descricao || "-"}>
                          {departamento.descricao || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {departamento._count?.funcionarios || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(departamento.ativo)} text-xs`}>
                          {departamento.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {formatBrazilianDate(departamento.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(departamento)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(departamento)}
                            disabled={departamento._count?.funcionarios > 0}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Excluir</span>
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
      <AddDepartamentoModal
        open={showAddModal}
        onClose={handleModalClose}
      />

      {selectedDepartamento && (
        <>
          <EditDepartamentoModal
            open={showEditModal}
            onClose={handleModalClose}
            departamento={selectedDepartamento}
          />

          <DeleteDepartamentoModal
            open={showDeleteModal}
            onClose={handleModalClose}
            departamento={selectedDepartamento}
          />
        </>
      )}
    </div>
  );
}