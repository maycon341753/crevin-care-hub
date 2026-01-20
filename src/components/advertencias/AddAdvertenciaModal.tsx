import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DateInput from "@/components/ui/date-input";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
}

interface AddAdvertenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddAdvertenciaModal({ open, onOpenChange, onSuccess }: AddAdvertenciaModalProps) {
  const [loading, setLoading] = useState(false);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [formData, setFormData] = useState({
    funcionario_id: "",
    tipo: "",
    motivo: "",
    descricao: "",
    data_advertencia: new Date().toISOString().split('T')[0],
    observacoes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchFuncionarios();
    }
  }, [open]);

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, cargo')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de funcionários.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.funcionario_id || !formData.tipo || !formData.motivo) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('advertencias')
        .insert({
          funcionario_id: formData.funcionario_id,
          tipo: formData.tipo,
          motivo: formData.motivo,
          descricao: formData.descricao || null,
          data_advertencia: formData.data_advertencia,
          observacoes: formData.observacoes || null,
          aplicada_por: user.id,
          created_by: user.id,
          status: 'ativa'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Advertência registrada com sucesso.",
      });

      // Reset form
      setFormData({
        funcionario_id: "",
        tipo: "",
        motivo: "",
        descricao: "",
        data_advertencia: new Date().toISOString().split('T')[0],
        observacoes: ""
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar advertência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a advertência.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      funcionario_id: "",
      tipo: "",
      motivo: "",
      descricao: "",
      data_advertencia: new Date().toISOString().split('T')[0],
      observacoes: ""
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Advertência</DialogTitle>
          <DialogDescription>
            Registre uma nova advertência para um funcionário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="funcionario">Funcionário *</Label>
            <Select
              value={formData.funcionario_id}
              onValueChange={(value) => setFormData({ ...formData, funcionario_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((funcionario) => (
                  <SelectItem key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome} - {funcionario.cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Advertência *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verbal">Verbal</SelectItem>
                <SelectItem value="escrita">Escrita</SelectItem>
                <SelectItem value="suspensao">Suspensão</SelectItem>
                <SelectItem value="advertencia_final">Advertência Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Input
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ex: Atraso recorrente, Falta não justificada..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_advertencia">Data da Advertência *</Label>
            <DateInput
              id="data_advertencia"
              value={formData.data_advertencia}
              onChange={(value) => setFormData({ ...formData, data_advertencia: value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição Detalhada</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva os detalhes da situação que levou à advertência..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Advertência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}