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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Departamento {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface EditDepartamentoModalProps {
  open: boolean;
  onClose: () => void;
  departamento: Departamento;
}

export function EditDepartamentoModal({ open, onClose, departamento }: EditDepartamentoModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (departamento) {
      setFormData({
        nome: departamento.nome,
        descricao: departamento.descricao || "",
        ativo: departamento.ativo,
      });
    }
  }, [departamento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do departamento é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('departamentos')
        .update({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', departamento.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Departamento atualizado com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o departamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Departamento</DialogTitle>
          <DialogDescription>
            Atualize as informações do departamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Recursos Humanos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do departamento (opcional)"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label htmlFor="ativo">Departamento ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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