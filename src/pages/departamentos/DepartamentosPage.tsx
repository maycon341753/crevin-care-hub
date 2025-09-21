import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os departamentos da organização
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Departamento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Departamentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departamentos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departamentos.filter(d => d.ativo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos Inativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departamentos.filter(d => !d.ativo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departamentos.reduce((acc, d) => acc + (d._count?.funcionarios || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Departamentos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os departamentos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar departamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Funcionários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {searchTerm ? "Nenhum departamento encontrado." : "Nenhum departamento cadastrado."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartamentos.map((departamento) => (
                    <TableRow key={departamento.id}>
                      <TableCell className="font-medium">
                        {departamento.nome}
                      </TableCell>
                      <TableCell>
                        {departamento.descricao || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {departamento._count?.funcionarios || 0} funcionários
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(departamento.ativo)}>
                          {departamento.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(departamento.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(departamento)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(departamento)}
                            disabled={departamento._count?.funcionarios > 0}
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