import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo?: string;
}

interface Idoso {
  id: string;
  nome: string;
}

interface EventFormData {
  titulo: string;
  descricao: string;
  data_inicio: string;
  hora_inicio?: string;
  data_fim: string;
  hora_fim?: string;
  tipo: string;
  status: string;
  prioridade: string;
  local: string;
  funcionario_id?: string;
  idoso_id?: string;
  all_day: boolean;
  recorrencia?: string;
  cor: string;
  observacoes: string;
}

export const AddEventModal = ({ open, onOpenChange, onSuccess }: AddEventModalProps) => {
  console.log("AddEventModal renderizado com open:", open);
  console.log("AddEventModal - Props recebidas:", { open, onOpenChange: !!onOpenChange, onSuccess: !!onSuccess });
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    titulo: "",
    descricao: "",
    data_inicio: "",
    hora_inicio: "",
    data_fim: "",
    hora_fim: "",
    tipo: "evento",
    status: "agendado",
    prioridade: "media",
    local: "",
    funcionario_id: "none",
    idoso_id: "none",
    all_day: false,
    recorrencia: "none",
    cor: "#3b82f6",
    observacoes: "",
  });

  useEffect(() => {
    if (open) {
      fetchFuncionarios();
      fetchIdosos();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      data_inicio: "",
      hora_inicio: "",
      data_fim: "",
      hora_fim: "",
      tipo: "evento",
      status: "agendado",
      prioridade: "media",
      local: "",
      funcionario_id: "none",
      idoso_id: "none",
      all_day: false,
      recorrencia: "none",
      cor: "#3b82f6",
      observacoes: ""
    });
  };

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'developer'])
        .eq('active', true)
        .order('full_name');

      if (error) throw error;
      
      // Mapear os dados para o formato esperado
      const administradores = data?.map(profile => ({
        id: profile.id,
        nome: profile.full_name || 'Sem nome',
        cargo: profile.role === 'developer' ? 'Desenvolvedor' : 'Administrador'
      })) || [];
      
      setFuncionarios(administradores);
    } catch (error) {
      console.error('Erro ao buscar administradores:', error);
    }
  };

  const fetchIdosos = async () => {
    try {
      const { data, error } = await supabase
        .from('idosos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setIdosos(data || []);
    } catch (error) {
      console.error('Erro ao buscar idosos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.titulo.trim()) {
        toast({
          title: "Erro",
          description: "O título é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.data_inicio) {
        toast({
          title: "Erro",
          description: "A data de início é obrigatória.",
          variant: "destructive",
        });
        return;
      }

      const eventData: any = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        tipo: formData.tipo,
        status: formData.status,
        prioridade: formData.prioridade,
        local: formData.local.trim() || null,
        all_day: formData.all_day,
        recorrencia: formData.recorrencia === "none" ? null : formData.recorrencia,
        cor: formData.cor,
        observacoes: formData.observacoes.trim() || null,
        funcionario_id: formData.funcionario_id === "none" ? null : formData.funcionario_id,
        idoso_id: formData.idoso_id === "none" ? null : formData.idoso_id,
      };

      if (formData.all_day) {
        eventData.data_inicio = `${formData.data_inicio}T00:00:00`;
        eventData.data_fim = formData.data_fim ? `${formData.data_fim}T23:59:59` : `${formData.data_inicio}T23:59:59`;
      } else {
        const horaInicio = formData.hora_inicio || "09:00";
        eventData.data_inicio = `${formData.data_inicio}T${horaInicio}:00`;
        
        if (formData.data_fim && formData.hora_fim) {
          eventData.data_fim = `${formData.data_fim}T${formData.hora_fim}:00`;
        } else if (formData.hora_fim) {
          eventData.data_fim = `${formData.data_inicio}T${formData.hora_fim}:00`;
        }
      }

      const { error } = await supabase
        .from('agenda')
        .insert([eventData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar evento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
          <DialogDescription>
            Crie um novo evento na agenda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Digite o título do evento"
                required
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Digite uma descrição detalhada (opcional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="atividade">Atividade</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="terapia">Terapia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value) => handleInputChange('prioridade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="all_day"
                checked={formData.all_day}
                onCheckedChange={(checked) => handleInputChange('all_day', checked)}
              />
              <Label htmlFor="all_day">Evento de dia inteiro</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                  required
                />
              </div>

              {!formData.all_day && (
                <div>
                  <Label htmlFor="hora_inicio">Hora de Início</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => handleInputChange('hora_inicio', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_fim">Data de Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => handleInputChange('data_fim', e.target.value)}
                />
              </div>

              {!formData.all_day && (
                <div>
                  <Label htmlFor="hora_fim">Hora de Fim</Label>
                  <Input
                    id="hora_fim"
                    type="time"
                    value={formData.hora_fim}
                    onChange={(e) => handleInputChange('hora_fim', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => handleInputChange('local', e.target.value)}
                placeholder="Local onde o evento acontecerá"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="funcionario_id">Funcionário Responsável</Label>
                <Select value={formData.funcionario_id} onValueChange={(value) => handleInputChange('funcionario_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {funcionarios.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome} {funcionario.cargo && `(${funcionario.cargo})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="idoso_id">Idoso Relacionado</Label>
                <Select value={formData.idoso_id} onValueChange={(value) => handleInputChange('idoso_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um idoso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {idosos.map((idoso) => (
                      <SelectItem key={idoso.id} value={idoso.id}>
                        {idoso.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cor">Cor do Evento</Label>
                <Input
                  id="cor"
                  type="color"
                  value={formData.cor}
                  onChange={(e) => handleInputChange('cor', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="recorrencia">Recorrência</Label>
              <Select value={formData.recorrencia} onValueChange={(value) => handleInputChange('recorrencia', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a recorrência (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}