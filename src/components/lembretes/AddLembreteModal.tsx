import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DateInput from '@/components/ui/date-input';

interface AddLembreteModalProps {
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

export default function AddLembreteModal({ open, onOpenChange, onSuccess }: AddLembreteModalProps) {
  const [loading, setLoading] = useState(false);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_lembrete: "",
    hora_lembrete: "",
    tipo: "geral",
    prioridade: "media",
    funcionario_id: "",
    idoso_id: "",
    observacoes: "",
    recorrente: false,
    tipo_recorrencia: ""
  });

  useEffect(() => {
    if (open) {
      fetchFuncionarios();
      fetchIdosos();
    }
  }, [open]);

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, cargo')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar funcionários:', error);
        return;
      }

      setFuncionarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  };

  const fetchIdosos = async () => {
    try {
      const { data, error } = await supabase
        .from('idosos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar idosos:', error);
        return;
      }

      setIdosos(data || []);
    } catch (error) {
      console.error('Erro ao buscar idosos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.data_lembrete) {
      toast({
        title: "Erro",
        description: "A data do lembrete é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const lembreteData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        data_lembrete: formData.data_lembrete,
        hora_lembrete: formData.hora_lembrete || null,
        tipo: formData.tipo,
        prioridade: formData.prioridade,
        status: 'pendente',
        funcionario_id: formData.funcionario_id === 'none' ? null : formData.funcionario_id || null,
        idoso_id: formData.idoso_id === 'none' ? null : formData.idoso_id || null,
        criado_por: null, // TODO: Implementar autenticação para pegar o usuário atual
        observacoes: formData.observacoes.trim() || null,
        notificado: false,
        data_notificacao: null,
        recorrente: formData.recorrente,
        tipo_recorrencia: formData.recorrente ? formData.tipo_recorrencia : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('lembretes')
        .insert([lembreteData]);

      if (error) {
        console.error('Erro ao criar lembrete:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o lembrete.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Lembrete criado com sucesso!",
      });

      // Reset form
      setFormData({
        titulo: "",
        descricao: "",
        data_lembrete: "",
        hora_lembrete: "",
        tipo: "geral",
        prioridade: "media",
        funcionario_id: "",
        idoso_id: "",
        observacoes: "",
        recorrente: false,
        tipo_recorrencia: ""
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar lembrete.",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lembrete</DialogTitle>
          <DialogDescription>
            Crie um novo lembrete para o sistema
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
                placeholder="Digite o título do lembrete"
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
                <Label htmlFor="data_lembrete">Data do Lembrete *</Label>
                <DateInput
                  id="data_lembrete"
                  value={formData.data_lembrete}
                  onChange={(value) => handleInputChange('data_lembrete', value)}
                  placeholder="dd/mm/aaaa"
                  required
                />
              </div>

              <div>
                <Label htmlFor="hora_lembrete">Hora do Lembrete</Label>
                <Input
                  id="hora_lembrete"
                  type="time"
                  value={formData.hora_lembrete}
                  onChange={(e) => handleInputChange('hora_lembrete', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="medicamento">Medicamento</SelectItem>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="atividade">Atividade</SelectItem>
                    <SelectItem value="alimentacao">Alimentação</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
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

            <div className="flex items-center space-x-2">
              <Switch
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => handleInputChange('recorrente', checked)}
              />
              <Label htmlFor="recorrente">Lembrete recorrente</Label>
            </div>

            {formData.recorrente && (
              <div>
                <Label htmlFor="tipo_recorrencia">Tipo de Recorrência</Label>
                <Select value={formData.tipo_recorrencia} onValueChange={(value) => handleInputChange('tipo_recorrencia', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a recorrência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Lembrete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}