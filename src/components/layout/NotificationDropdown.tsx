import React, { useState, useEffect } from 'react';
import { Bell, Clock, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Lembrete {
  id: string;
  titulo: string;
  descricao: string;
  data_lembrete: string;
  hora_lembrete: string;
  prioridade: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'concluido' | 'cancelado';
  notificado: boolean;
  funcionario_id?: string;
  idoso_id?: string;
  funcionario?: { nome: string };
  idoso?: { nome: string };
}

export function NotificationDropdown() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchPendingLembretes = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('lembretes')
        .select(`
          *,
          funcionario:funcionarios!funcionario_id(nome),
          idoso:idosos!idoso_id(nome)
        `)
        .eq('status', 'pendente')
        .lte('data_lembrete', todayStr)
        .order('data_lembrete', { ascending: true })
        .order('hora_lembrete', { ascending: true });

      if (error) {
        console.error('Erro ao buscar lembretes:', error);
        toast.error('Erro ao carregar notificações');
        return;
      }

      setLembretes(data || []);
    } catch (error) {
      console.error('Erro ao buscar lembretes:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const markAsNotified = async (lembreteId: string) => {
    try {
      const { error } = await supabase
        .from('lembretes')
        .update({ 
          notificado: true,
          data_notificacao: new Date().toISOString()
        })
        .eq('id', lembreteId);

      if (error) {
        console.error('Erro ao marcar como notificado:', error);
        return;
      }

      // Remove o lembrete da lista local
      setLembretes(prev => prev.filter(l => l.id !== lembreteId));
      toast.success('Notificação marcada como lida');
    } catch (error) {
      console.error('Erro ao marcar como notificado:', error);
    }
  };

  const markAllAsNotified = async () => {
    try {
      const lembreteIds = lembretes.map(l => l.id);
      
      const { error } = await supabase
        .from('lembretes')
        .update({ 
          notificado: true,
          data_notificacao: new Date().toISOString()
        })
        .in('id', lembreteIds);

      if (error) {
        console.error('Erro ao marcar todos como notificados:', error);
        return;
      }

      setLembretes([]);
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todos como notificados:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5); // Remove seconds
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'text-red-600';
      case 'media':
        return 'text-yellow-600';
      case 'baixa':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityBadgeVariant = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingLembretes();
    }
  }, [isOpen]);

  // Auto-refresh every 5 minutes when dropdown is open
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(fetchPendingLembretes, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {lembretes.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {lembretes.length > 99 ? '99+' : lembretes.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-semibold">
          <div className="flex items-center justify-between">
            <span>Notificações de Lembretes</span>
            {lembretes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsNotified}
                className="text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando notificações...
          </div>
        ) : lembretes.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação pendente
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            {lembretes.map((lembrete) => (
              <DropdownMenuItem
                key={lembrete.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-muted/50"
                onClick={() => markAsNotified(lembrete.id)}
              >
                <div className="flex items-start justify-between w-full mb-2">
                  <h4 className="font-medium text-sm line-clamp-1">
                    {lembrete.titulo}
                  </h4>
                  <Badge 
                    variant={getPriorityBadgeVariant(lembrete.prioridade)}
                    className="ml-2 text-xs"
                  >
                    {lembrete.prioridade}
                  </Badge>
                </div>
                
                {lembrete.descricao && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {lembrete.descricao}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground w-full">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(lembrete.data_lembrete)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(lembrete.hora_lembrete)}</span>
                  </div>
                </div>
                
                {(lembrete.funcionario?.nome || lembrete.idoso?.nome) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <User className="h-3 w-3" />
                    <span>
                      {lembrete.funcionario?.nome || lembrete.idoso?.nome}
                    </span>
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}