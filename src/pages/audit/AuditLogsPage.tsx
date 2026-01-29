import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, Calendar, User, Activity, RefreshCw, Eye, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatBrazilianDateTime } from "@/lib/utils";
import { format } from "date-fns";
import { DatePickerBr } from "@/components/ui/date-picker-br";

interface AuditLog {
  id: string;
  user_id: string;
  operation: string | null;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface FilterState {
  search: string;
  action: string;
  table_name: string;
  user_id: string;
  date_from: string;
  date_to: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    action: "",
    table_name: "",
    user_id: "",
    date_from: "",
    date_to: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 50;
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      console.log('Perfis carregados:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`operation.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%`);
      }

      if (filters.action) {
        query = query.eq('operation', filters.action);
      }

      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', `${filters.date_from}T00:00:00`);
      }

      if (filters.date_to) {
        query = query.lte('created_at', `${filters.date_to}T23:59:59`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

      if (error) throw error;

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs de auditoria.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, itemsPerPage, toast]);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    fetchLogs(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      action: "",
      table_name: "",
      user_id: "",
      date_from: "",
      date_to: "",
    });
    fetchLogs(1);
  };

  const getActionBadgeVariant = (action: string | null | undefined) => {
    if (!action) return 'outline';
    
    switch (action.toLowerCase()) {
      case 'insert':
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatJsonData = (data: Record<string, unknown> | null) => {
    if (!data) return 'N/A';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitore todas as ações realizadas no sistema
          </p>
        </div>
        <Button 
          onClick={() => fetchLogs(currentPage)} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="crevin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">
              registros encontrados
            </p>
          </CardContent>
        </Card>

        <Card className="crevin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {new Set(logs.map(log => log.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              usuários únicos
            </p>
          </CardContent>
        </Card>

        <Card className="crevin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operações</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {new Set(logs.map(log => log.operation)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              tipos diferentes
            </p>
          </CardContent>
        </Card>

        <Card className="crevin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {totalPages}
            </div>
            <p className="text-xs text-muted-foreground">
              páginas de dados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar logs específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por ação ou tabela..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Ação</Label>
              <Select
                value={filters.action || "all"}
                onValueChange={(value) => handleFilterChange('action', value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="INSERT">Inserir</SelectItem>
                  <SelectItem value="UPDATE">Atualizar</SelectItem>
                  <SelectItem value="DELETE">Excluir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="table">Tabela</Label>
              <Select
                value={filters.table_name || "all"}
                onValueChange={(value) => handleFilterChange('table_name', value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as tabelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tabelas</SelectItem>
                  <SelectItem value="profiles">Usuários</SelectItem>
                  <SelectItem value="funcionarios">Funcionários</SelectItem>
                  <SelectItem value="idosos">Idosos</SelectItem>
                  <SelectItem value="departamentos">Departamentos</SelectItem>
                  <SelectItem value="doacoes">Doações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Usuário</Label>
              <Select
                value={filters.user_id || "all"}
                onValueChange={(value) => handleFilterChange('user_id', value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || 'Usuário sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_from">Data Inicial</Label>
              <DatePickerBr
                date={filters.date_from ? new Date(filters.date_from + 'T12:00:00') : undefined}
                setDate={(date) => handleFilterChange('date_from', date ? format(date, 'yyyy-MM-dd') : '')}
                placeholder="Selecione a data inicial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_to">Data Final</Label>
              <DatePickerBr
                date={filters.date_to ? new Date(filters.date_to + 'T12:00:00') : undefined}
                setDate={(date) => handleFilterChange('date_to', date ? format(date, 'yyyy-MM-dd') : '')}
                placeholder="Selecione a data final"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row mt-4">
            <Button onClick={applyFilters} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Registros de Auditoria
          </CardTitle>
          <CardDescription>
            {logs.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Data/Hora</TableHead>
                      <TableHead className="min-w-[150px]">Usuário</TableHead>
                      <TableHead className="min-w-[80px]">Ação</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">Tabela</TableHead>
                      <TableHead className="min-w-[100px] hidden md:table-cell">Registro ID</TableHead>
                      <TableHead className="min-w-[100px] hidden lg:table-cell">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum log encontrado</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs sm:text-sm">
                            <div className="whitespace-nowrap">
                              {formatBrazilianDateTime(log.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                              <div className="min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">
                                  {users.find(u => u.id === log.user_id)?.full_name || (
                                    <span className="text-muted-foreground italic" title={log.user_id}>
                                      ID: {log.user_id?.substring(0, 8)}...
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground sm:hidden">
                                  {log.table_name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.operation)} className="text-xs">
                              {log.operation}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm hidden sm:table-cell">
                            {log.table_name}
                          </TableCell>
                          <TableCell className="font-mono text-xs hidden md:table-cell">
                            {log.record_id || 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono text-xs hidden lg:table-cell">
                            {log.ip_address || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex-1 sm:flex-none"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex-1 sm:flex-none"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}