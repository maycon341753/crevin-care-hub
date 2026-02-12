import { useState, useEffect, useRef } from 'react';
import { Clock, Activity, User, Database, FileText, Settings, Trash2, Edit, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'insert':
    case 'create':
      return <Plus className="h-4 w-4 text-green-500" />;
    case 'update':
    case 'edit':
      return <Edit className="h-4 w-4 text-blue-500" />;
    case 'delete':
    case 'remove':
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'login':
    case 'signin':
      return <User className="h-4 w-4 text-purple-500" />;
    case 'logout':
    case 'signout':
      return <User className="h-4 w-4 text-gray-500" />;
    default:
      return <Database className="h-4 w-4 text-gray-500" />;
  }
};

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'insert':
    case 'create':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'update':
    case 'edit':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'delete':
    case 'remove':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'login':
    case 'signin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'logout':
    case 'signout':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTableDisplayName = (tableName: string) => {
  const tableNames: { [key: string]: string } = {
    'funcionarios': 'Funcionários',
    'idosos': 'Idosos',
    'doacoes_dinheiro': 'Doações em Dinheiro',
    'doacoes_itens': 'Doações de Itens',
    'departamentos': 'Departamentos',
    'profiles': 'Perfis',
    'users': 'Usuários',
    'lembretes': 'Lembretes',
    'contas_receber': 'Contas a Receber',
    'contas_pagar': 'Contas a Pagar',
    'movimentacoes_financeiras': 'Movimentações Financeiras',
  };
  return tableNames[tableName] || tableName;
};

export function RecentActivitiesDropdown() {
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const pollRef = useRef<number | null>(null);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Primeiro buscar os logs de auditoria
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          table_name,
          record_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (auditError) {
        console.error('Erro ao buscar atividades:', auditError);
        toast.error('Erro ao carregar atividades recentes');
        return;
      }

      // Depois buscar os nomes dos usuários
      const userIds = [...new Set(auditData?.map(log => log.user_id).filter(Boolean))];
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      // Combinar os dados
      const activitiesWithProfiles = auditData?.map(log => ({
        ...log,
        profiles: profilesData.find(profile => profile.user_id === log.user_id) || null
      })) || [];

      setActivities(activitiesWithProfiles);
      setLastUpdated(new Date());
      setHasNew(false);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      toast.error('Erro ao carregar atividades recentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecentActivities();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      pollRef.current = window.setInterval(() => {
        fetchRecentActivities();
      }, 15000);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const channel = supabase
      .channel('audit-logs-recent')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => {
          if (isOpen) {
            fetchRecentActivities();
          } else {
            setHasNew(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isOpen]);

  const formatActivityDescription = (activity: AuditLog) => {
    const tableName = getTableDisplayName(activity.table_name);
    const userName = activity.profiles?.full_name || 'Usuário';
    
    switch (activity.action.toLowerCase()) {
      case 'insert':
      case 'create':
        return `${userName} criou um registro em ${tableName}`;
      case 'update':
      case 'edit':
        return `${userName} atualizou um registro em ${tableName}`;
      case 'delete':
      case 'remove':
        return `${userName} removeu um registro de ${tableName}`;
      case 'login':
      case 'signin':
        return `${userName} fez login no sistema`;
      case 'logout':
      case 'signout':
        return `${userName} fez logout do sistema`;
      default:
        return `${userName} executou ${activity.action} em ${tableName}`;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Activity className="h-4 w-4" />
          <span className="sr-only">Atividades recentes</span>
          {hasNew && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Atividades Recentes do Sistema
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => fetchRecentActivities()}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2" />
              <p className="text-sm">Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => (
                <DropdownMenuItem key={activity.id} className="flex-col items-start p-3 cursor-default">
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getActionColor(activity.action)}`}
                        >
                          {activity.action.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {formatActivityDescription(activity)}
                      </p>
                      {activity.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          IP: {activity.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm text-muted-foreground cursor-default">
          <Settings className="h-4 w-4 mr-2" />
          Apenas desenvolvedores podem ver logs completos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
