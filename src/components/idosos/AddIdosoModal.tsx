import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Idoso } from "@/types";

interface AddIdosoModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddIdosoModal({ open, onClose }: AddIdosoModalProps) {
  const [formData, setFormData] = useState<Partial<Idoso>>({
    nome: "",
    cpf: "",
    rg: "",
    data_nascimento: "",
    telefone: "",
    endereco: "",
    contato_emergencia: "",
    observacoes_medicas: "",
    ativo: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('idosos')
        .insert([{
          nome: formData.nome,
          cpf: formData.cpf?.replace(/\D/g, ''),
          rg: formData.rg || null,
          data_nascimento: formData.data_nascimento,
          telefone: formData.telefone?.replace(/\D/g, '') || null,
          endereco: formData.endereco || null,
          contato_emergencia: formData.contato_emergencia || null,
          observacoes_medicas: formData.observacoes_medicas || null,
          ativo: formData.ativo ?? true,
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Idoso cadastrado com sucesso!",
      });

      setFormData({
        nome: "",
        cpf: "",
        rg: "",
        data_nascimento: "",
        telefone: "",
        endereco: "",
        contato_emergencia: "",
        observacoes_medicas: "",
        ativo: true,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao cadastrar idoso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o idoso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Idoso</DialogTitle>
          <DialogDescription>
            Cadastre um novo idoso no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={formData.rg || ""}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco || ""}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contato_emergencia">Contato de Emergência</Label>
            <Input
              id="contato_emergencia"
              value={formData.contato_emergencia || ""}
              onChange={(e) => setFormData({ ...formData, contato_emergencia: e.target.value })}
              placeholder="Nome e telefone do contato"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes_medicas">Observações Médicas</Label>
            <Textarea
              id="observacoes_medicas"
              value={formData.observacoes_medicas || ""}
              onChange={(e) => setFormData({ ...formData, observacoes_medicas: e.target.value })}
              placeholder="Informações médicas relevantes..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ativo">Status</Label>
            <Select
              value={formData.ativo ? "true" : "false"}
              onValueChange={(value) => setFormData({ ...formData, ativo: value === "true" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}