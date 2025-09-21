import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Advertencia {
  id: string;
  funcionario_id: string;
  tipo: 'verbal' | 'escrita' | 'suspensao' | 'advertencia_final';
  motivo: string;
  descricao?: string;
  data_advertencia: string;
  status: 'ativa' | 'revogada' | 'cumprida';
  observacoes?: string;
  funcionario?: {
    nome: string;
    cargo: string;
  };
}

interface EditAdvertenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  advertencia: Advertencia | null;
}

export default function EditAdvertenciaModal({ open, onOpenChange, onSuccess, advertencia }: EditAdvertenciaModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "",
    motivo: "",
    descricao: "",
    data_advertencia: "",
    status: "",
    observacoes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (advertencia && open) {
      setFormData({
        tipo: advertencia.tipo,
        motivo: advertencia.motivo,
        descricao: advertencia.descricao || "",
        data_advertencia: advertencia.data_advertencia,
        status: advertencia.status,
        observacoes: advertencia.observacoes || ""
      });
    }
  }, [advertencia, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!advertencia || !formData.tipo || !formData.motivo) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('advertencias')
        .update({
          tipo: formData.tipo,
          motivo: formData.motivo,
          descricao: formData.descricao || null,
          data_advertencia: formData.data_advertencia,
          status: formData.status,
          observacoes: formData.observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', advertencia.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Advertência atualizada com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar advertência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a advertência.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!advertencia) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Advertência</DialogTitle>
          <DialogDescription>
            Edite as informações da advertência de {advertencia.funcionario?.nome}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Input
              value={`${advertencia.funcionario?.nome} - ${advertencia.funcionario?.cargo}`}
              disabled
              className="bg-muted"
            />
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
            <Input
              id="data_advertencia"
              type="date"
              value={formData.data_advertencia}
              onChange={(e) => setFormData({ ...formData, data_advertencia: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="cumprida">Cumprida</SelectItem>
                <SelectItem value="revogada">Revogada</SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}