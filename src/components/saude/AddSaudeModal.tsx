import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Idoso {
  id: string;
  nome: string;
}

interface AddSaudeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddSaudeModal({ open, onOpenChange, onSuccess }: AddSaudeModalProps) {
  const [loading, setLoading] = useState(false);
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [formData, setFormData] = useState({
    idoso_id: "",
    tipo_registro: "",
    data_registro: new Date().toISOString().split('T')[0],
    hora_registro: "",
    descricao: "",
    medico_responsavel: "",
    especialidade: "",
    resultado: "",
    observacoes: "",
    status: "ativo",
    prioridade: "normal"
  });
  const { toast } = useToast();

  // Buscar idosos para o select
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de idosos.",
        variant: "destructive",
      });
    }
  };

  // Função para salvar registro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.idoso_id || !formData.tipo_registro || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const dataToInsert = {
        ...formData,
        hora_registro: formData.hora_registro || null,
        medico_responsavel: formData.medico_responsavel || null,
        especialidade: formData.especialidade || null,
        resultado: formData.resultado || null,
        observacoes: formData.observacoes || null,
        created_by: user.id
      };

      const { error } = await supabase
        .from('saude_idosos')
        .insert([dataToInsert]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de saúde criado com sucesso!",
      });

      // Reset form
      setFormData({
        idoso_id: "",
        tipo_registro: "",
        data_registro: new Date().toISOString().split('T')[0],
        hora_registro: "",
        descricao: "",
        medico_responsavel: "",
        especialidade: "",
        resultado: "",
        observacoes: "",
        status: "ativo",
        prioridade: "normal"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro de saúde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchIdosos();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Registro de Saúde</DialogTitle>
          <DialogDescription>
            Adicione um novo registro médico para um idoso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idoso_id">Idoso *</Label>
              <Select
                value={formData.idoso_id}
                onValueChange={(value) => setFormData({ ...formData, idoso_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um idoso" />
                </SelectTrigger>
                <SelectContent>
                  {idosos.map((idoso) => (
                    <SelectItem key={idoso.id} value={idoso.id}>
                      {idoso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_registro">Tipo de Registro *</Label>
              <Select
                value={formData.tipo_registro}
                onValueChange={(value) => setFormData({ ...formData, tipo_registro: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="medicamento">Medicamento</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="observacao">Observação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_registro">Data do Registro *</Label>
              <Input
                id="data_registro"
                type="date"
                value={formData.data_registro}
                onChange={(e) => setFormData({ ...formData, data_registro: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_registro">Hora do Registro</Label>
              <Input
                id="hora_registro"
                type="time"
                value={formData.hora_registro}
                onChange={(e) => setFormData({ ...formData, hora_registro: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o registro médico..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medico_responsavel">Médico Responsável</Label>
              <Input
                id="medico_responsavel"
                placeholder="Nome do médico"
                value={formData.medico_responsavel}
                onChange={(e) => setFormData({ ...formData, medico_responsavel: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                placeholder="Ex: Cardiologia, Geriatria..."
                value={formData.especialidade}
                onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resultado">Resultado</Label>
            <Textarea
              id="resultado"
              placeholder="Resultado do exame ou consulta..."
              value={formData.resultado}
              onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}