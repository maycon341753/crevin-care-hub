import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Users, Shield, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddProfileModal } from "@/components/profiles/AddProfileModal";
import { EditProfileModal } from "@/components/profiles/EditProfileModal";
import { DeleteProfileModal } from "@/components/profiles/DeleteProfileModal";

interface Profile {
  id: string;
  full_name: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;

      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar profiles:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowEditModal(true);
  };

  const handleDelete = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedProfile(null);
    fetchProfiles();
  };

  const getStatusBadge = (ativo: boolean) => {
    return ativo 
      ? "bg-green-100 text-green-800 hover:bg-green-100" 
      : "bg-red-100 text-red-800 hover:bg-red-100";
  };

  const getRoleBadge = (role: string) => {
    if (!role) return null;
    
    const roleColors: { [key: string]: string } = {
      'admin': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'administrador': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'gerente': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'funcionario': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      'funcionário': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };

    const color = roleColors[role.toLowerCase()] || 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    
    return (
      <Badge className={color}>
        <Shield className="h-3 w-3 mr-1" />
        {role}
      </Badge>
    );
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie os usuários e perfis de acesso ao sistema
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              0
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => p.role && (p.role.toLowerCase().includes('admin') || p.role.toLowerCase().includes('gerente'))).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[200px] hidden sm:table-cell">Email</TableHead>
                  <TableHead className="min-w-[120px]">Cargo</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell">Departamento</TableHead>
                  <TableHead className="min-w-[120px] hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Status</TableHead>
                  <TableHead className="min-w-[120px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{profile.full_name || "Nome não informado"}</div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            {profile.user_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {profile.user_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(profile.role)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        -
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        -
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(profile)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(profile)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
      <AddProfileModal
        open={showAddModal}
        onClose={handleModalClose}
      />

      {selectedProfile && (
        <>
          <EditProfileModal
            open={showEditModal}
            onClose={handleModalClose}
            profile={selectedProfile}
          />

          <DeleteProfileModal
            open={showDeleteModal}
            onClose={handleModalClose}
            profile={selectedProfile}
          />
        </>
      )}
    </div>
  );
}