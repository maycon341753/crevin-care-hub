import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Users, Shield, Mail, Calendar, Eye, EyeOff, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatBrazilianDate } from "@/lib/utils";

interface User {
  id: string;
  user_id: string;
  email?: string;
  full_name: string;
  role: 'user' | 'admin' | 'developer';
  status?: 'active' | 'pending' | 'inactive';
  active?: boolean;
  created_at: string;
  updated_at: string;
}

interface NewUserData {
  email: string;
  password: string;
  full_name: string;
  role: 'user' | 'admin' | 'developer';
  first_name?: string;
  last_name?: string;
  phone?: string;
  job_title?: string;
  bio?: string;
}

interface EditUserData {
  full_name: string;
  role: 'user' | 'admin' | 'developer';
  password?: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState<NewUserData>({
    email: "",
    password: "",
    full_name: "",
    role: "user",
    first_name: "",
    last_name: "",
    phone: "",
    job_title: "",
    bio: "",
  });
  const [editUserData, setEditUserData] = useState<EditUserData>({
    full_name: "",
    role: "user",
    password: "",
  });
  const { toast } = useToast();
  const { isDeveloper, loading: profileLoading } = useCurrentUserProfile();

  const fetchUsers = useCallback(async () => {
    console.log('🔄 Carregando usuários...');
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          full_name,
          role,
          avatar_url,
          phone,
          department_id,
          active,
          created_at,
          updated_at,
          status,
          permissions
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      console.log('✅ Usuários carregados:', usersData?.length || 0);

      setUsers(usersData || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: `Erro ao carregar usuários: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Verificações condicionais APÓS todos os hooks
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isDeveloper) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">Esta página é acessível apenas para desenvolvedores.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async () => {
    console.log('🚀 handleCreateUser chamado!');
    console.log('📋 Dados do formulário:', newUserData);
    
    // Validação básica
    if (!newUserData.email || !newUserData.full_name || !newUserData.role || !newUserData.password) {
      console.error('❌ Dados obrigatórios faltando:', {
        email: !!newUserData.email,
        full_name: !!newUserData.full_name,
        role: !!newUserData.role,
        password: !!newUserData.password
      });
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios (email, nome completo, função e senha).",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('✅ Validação passou, criando usuário no sistema de autenticação...');
      
      // 1. Primeiro criar o usuário no sistema de autenticação do Supabase
      console.log('🔐 Criando usuário no auth.users...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            full_name: newUserData.full_name,
            role: newUserData.role
          }
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar usuário no sistema de autenticação:', authError);
        throw authError;
      }

      console.log('✅ Usuário criado no sistema de autenticação:', authData);
      
      // 2. Verificar se o usuário foi criado com sucesso
      if (!authData.user) {
        throw new Error('Falha ao criar usuário no sistema de autenticação');
      }

      // 3. Criar ou atualizar o perfil na tabela profiles
      console.log('📤 Criando/atualizando perfil na tabela profiles...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id, // Usar o ID do usuário autenticado
          user_id: authData.user.id,
          email: newUserData.email,
          full_name: newUserData.full_name,
          role: newUserData.role,
          active: true,
          status: 'active',
          first_name: newUserData.first_name || null,
          last_name: newUserData.last_name || null,
          phone: newUserData.phone || null,
          job_title: newUserData.job_title || null,
          bio: newUserData.bio || null
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
        console.error('📋 Detalhes completos do erro:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        // Se houve erro ao criar o perfil, tentar limpar o usuário criado no auth
        console.log('🧹 Tentando limpar usuário do sistema de autenticação...');
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('⚠️ Erro ao limpar usuário:', cleanupError);
        }
        
        throw profileError;
      }

      console.log('✅ Perfil criado com sucesso:', profileData);
      
      toast({
        title: "Usuário criado com sucesso",
        description: `Usuário ${newUserData.full_name} foi criado e pode fazer login com email e senha.`,
      });

      // Atualizar lista de usuários
      console.log('🔄 Atualizando lista de usuários...');
      await fetchUsers();
      
      // Limpar formulário
      console.log('🧹 Limpando formulário...');
      setNewUserData({
        email: "",
        password: "",
        full_name: "",
        role: "user",
        first_name: "",
        last_name: "",
        phone: "",
        job_title: "",
        bio: "",
      });
      setShowAddModal(false);
      console.log('✅ Processo concluído com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro ao criar usuário:', error);
      console.error('📋 Stack trace:', error.stack);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserRole = async (user: User, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Papel do usuário atualizado para ${newRole}.`,
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar papel do usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o papel do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      console.log('Deletando usuário:', selectedUser);
      
      // Deletar da tabela profiles usando o campo ID correto
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (profileError) {
        console.error('Erro ao deletar perfil:', profileError);
        throw profileError;
      }

      console.log('Usuário excluído com sucesso da tabela profiles');

      toast({
        title: "Usuário excluído",
        description: `Usuário ${selectedUser.full_name} foi excluído com sucesso.`,
      });

      setShowDeleteModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    console.log('🔄 handleEditUser chamado!');
    console.log('👤 Usuário selecionado:', selectedUser);
    console.log('📝 Dados de edição:', editUserData);
    
    if (!selectedUser) {
      console.error('❌ Nenhum usuário selecionado!');
      return;
    }

    try {
      console.log('💾 Atualizando perfil do usuário...');
      
      // Atualizar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editUserData.full_name,
          role: editUserData.role,
        })
        .eq('user_id', selectedUser.user_id)
        .select();

      if (profileError) {
        console.error('❌ Erro ao atualizar perfil:', profileError);
        throw profileError;
      }

      console.log('✅ Perfil atualizado com sucesso:', profileData);

      // Atualizar senha se fornecida
      if (editUserData.password && editUserData.password.trim() !== '') {
        console.log('🔐 Atualizando senha do usuário...');
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          selectedUser.user_id,
          { password: editUserData.password }
        );

        if (passwordError) {
          console.error('❌ Erro ao atualizar senha:', passwordError);
          throw passwordError;
        }
        
        console.log('✅ Senha atualizada com sucesso!');
      } else {
        console.log('ℹ️ Senha não fornecida, mantendo a atual');
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      console.log('🧹 Limpando modal e recarregando usuários...');
      setShowEditModal(false);
      setSelectedUser(null);
      setEditUserData({
        full_name: "",
        role: "user",
        password: "",
      });
      
      console.log('🔄 Recarregando lista de usuários...');
      await fetchUsers();
      console.log('✅ Processo de edição concluído!');
      
    } catch (error: any) {
      console.error('❌ Erro geral ao atualizar usuário:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleAuthorizeUser = async (user: User) => {
    console.log('🔓 Autorizando usuário:', user);
    
    try {
      // Atualizar status do usuário para 'active' e active para true
      const { data, error } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          active: true
        })
        .eq('user_id', user.user_id)
        .select();

      if (error) {
        console.error('❌ Erro ao autorizar usuário:', error);
        throw error;
      }

      console.log('✅ Usuário autorizado com sucesso:', data);

      toast({
        title: "Sucesso",
        description: `Usuário ${user.full_name} foi autorizado com sucesso!`,
      });

      // Recarregar lista de usuários
      await fetchUsers();
    } catch (error: any) {
      console.error('❌ Erro ao autorizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível autorizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUserData({
      full_name: user.full_name || "",
      role: user.role || "user",
      password: "",
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { 
        label: "Administrador", 
        variant: "default" as const, 
        className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
        icon: Shield
      },
      developer: { 
        label: "Desenvolvedor", 
        variant: "default" as const, 
        className: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
        icon: UserCheck
      },
      user: { 
        label: "Usuário", 
        variant: "secondary" as const, 
        className: "",
        icon: Users
      },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const IconComponent = config.icon;
    
    return (
      <Badge 
        variant={config.variant} 
        className={`${config.className} flex items-center gap-1`}
      >
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status?: string, active?: boolean) => {
    if (status === 'pending' || active === false) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
    }
    if (status === 'active' || active === true) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>;
    }
    if (status === 'inactive') {
      return <Badge variant="outline" className="text-red-600 border-red-600">Inativo</Badge>;
    }
    return <Badge variant="secondary">N/A</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e acessos do sistema
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Confirmados</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.email_confirmed_at).length}
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
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desenvolvedores</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'developer').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>
                        {user.role ? getRoleBadge(user.role) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status, user.active)}
                      </TableCell>
                      <TableCell>
                        N/A
                      </TableCell>
                      <TableCell>
                        {formatBrazilianDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {(user.status === 'pending' || user.active === false) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAuthorizeUser(user)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              title="Autorizar usuário"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
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

      {/* Seção destacada para Administradores */}
      {users.filter(u => u.role === 'admin' || u.role === 'developer').length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Shield className="h-5 w-5" />
              Administradores do Sistema
            </CardTitle>
            <CardDescription className="text-blue-600">
              Usuários com privilégios administrativos e de desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {users
                .filter(u => u.role === 'admin' || u.role === 'developer')
                .map((admin) => (
                  <div 
                    key={admin.id} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {admin.role === 'admin' ? (
                          <Shield className="h-5 w-5 text-blue-600" />
                        ) : (
                          <UserCheck className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{admin.full_name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{admin.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(admin.role)}
                      {getStatusBadge(admin.status, admin.active)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para adicionar usuário */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário no sistema. Preencha todos os campos obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="col-span-3"
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha *
              </Label>
              <Input
                id="password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="col-span-3"
                placeholder="Senha segura"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Nome Completo *
              </Label>
              <Input
                id="full_name"
                value={newUserData.full_name}
                onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                className="col-span-3"
                placeholder="Nome completo do usuário"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Função *
              </Label>
              <Select
                value={newUserData.role}
                onValueChange={(value: 'user' | 'admin' | 'developer') => 
                  setNewUserData({ ...newUserData, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="developer">Desenvolvedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">
                Primeiro Nome
              </Label>
              <Input
                id="first_name"
                value={newUserData.first_name || ''}
                onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                className="col-span-3"
                placeholder="Primeiro nome"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">
                Sobrenome
              </Label>
              <Input
                id="last_name"
                value={newUserData.last_name || ''}
                onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                className="col-span-3"
                placeholder="Sobrenome"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input
                id="phone"
                value={newUserData.phone || ''}
                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                className="col-span-3"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha *
              </Label>
              <Input
                id="password"
                type="password"
                value={newUserData.password || ''}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="col-span-3"
                placeholder="Senha para login"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="job_title" className="text-right">
                Cargo
              </Label>
              <Input
                id="job_title"
                value={newUserData.job_title || ''}
                onChange={(e) => setNewUserData({ ...newUserData, job_title: e.target.value })}
                className="col-span-3"
                placeholder="Cargo ou função"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bio" className="text-right">
                Biografia
              </Label>
              <Textarea
                id="bio"
                value={newUserData.bio || ''}
                onChange={(e) => setNewUserData({ ...newUserData, bio: e.target.value })}
                className="col-span-3"
                placeholder="Breve descrição sobre o usuário"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                console.log('🖱️ Botão "Criar Usuário" clicado!');
                handleCreateUser();
              }}
            >
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para confirmar exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário "{selectedUser?.full_name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações e permissões do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nome Completo
              </Label>
              <Input
                id="edit-name"
                value={editUserData.full_name}
                onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Nível de Acesso
              </Label>
              <Select
                value={editUserData.role}
                onValueChange={(value: 'user' | 'admin' | 'developer') =>
                  setEditUserData({ ...editUserData, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="developer">Desenvolvedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">
                Nova Senha
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={editUserData.password || ""}
                onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                className="col-span-3"
                placeholder="Deixe em branco para manter a atual"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              console.log('🖱️ Botão "Salvar Alterações" clicado!');
              handleEditUser();
            }}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}