import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Users, Calendar, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddIdosoModal } from "@/components/idosos/AddIdosoModal";
import { EditIdosoModal } from "@/components/idosos/EditIdosoModal";
import { DeleteIdosoModal } from "@/components/idosos/DeleteIdosoModal";
import { formatCPF, formatPhone } from "@/lib/utils";

interface Idoso {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string | null;
  endereco: string | null;
  contato_emergencia: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function IdososPage() {
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIdoso, setSelectedIdoso] = useState<Idoso | null>(null);
  const { toast } = useToast();

  const fetchIdosos = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('idosos')
        .select('*')
        .order('nome');

      if (error) throw error;

      setIdosos(data || []);
    } catch (error) {
      console.error('Erro ao carregar idosos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os idosos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIdosos();
  }, [fetchIdosos]);

  const filteredIdosos = idosos.filter(idoso =>
    idoso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idoso.cpf.includes(searchTerm.replace(/\D/g, '')) ||
    (idoso.telefone && idoso.telefone.includes(searchTerm.replace(/\D/g, '')))
  );

  const handleEdit = (idoso: Idoso) => {
    setSelectedIdoso(idoso);
    setShowEditModal(true);
  };

  const handleDelete = (idoso: Idoso) => {
    setSelectedIdoso(idoso);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedIdoso(null);
    fetchIdosos();
  };

  const getStatusBadge = (ativo: boolean) => {
    return ativo 
      ? "bg-green-100 text-green-800 hover:bg-green-100" 
      : "bg-red-100 text-red-800 hover:bg-red-100";
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
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
          <h1 className="text-3xl font-bold tracking-tight">Idosos</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro dos idosos atendidos pela instituição
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Idoso
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Idosos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{idosos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idosos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {idosos.filter(i => i.ativo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idosos Inativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {idosos.filter(i => !i.ativo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idade Média</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {idosos.length > 0 
                ? Math.round(idosos.reduce((acc, idoso) => acc + calculateAge(idoso.data_nascimento), 0) / idosos.length)
                : 0
              } anos
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Idosos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os idosos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
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
                  <TableHead>CPF</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdosos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum idoso encontrado." : "Nenhum idoso cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIdosos.map((idoso) => (
                    <TableRow key={idoso.id}>
                      <TableCell className="font-medium">
                        {idoso.nome}
                      </TableCell>
                      <TableCell>
                        {formatCPF(idoso.cpf)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {calculateAge(idoso.data_nascimento)} anos
                        </div>
                      </TableCell>
                      <TableCell>
                        {idoso.telefone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {formatPhone(idoso.telefone)}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {idoso.endereco ? (
                          <div className="flex items-center gap-1 max-w-[200px]">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate" title={idoso.endereco}>
                              {idoso.endereco}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(idoso.ativo)}>
                          {idoso.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(idoso)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(idoso)}
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
      <AddIdosoModal
        open={showAddModal}
        onClose={handleModalClose}
      />

      {selectedIdoso && (
        <>
          <EditIdosoModal
            open={showEditModal}
            onClose={handleModalClose}
            idoso={selectedIdoso}
          />

          <DeleteIdosoModal
            open={showDeleteModal}
            onClose={handleModalClose}
            idoso={selectedIdoso}
          />
        </>
      )}
    </div>
  );
}