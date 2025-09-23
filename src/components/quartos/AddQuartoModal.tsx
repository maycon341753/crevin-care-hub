import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateQuartoData } from "@/types/quarto";

interface AddQuartoModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddQuartoModal({ open, onClose }: AddQuartoModalProps) {
  const [formData, setFormData] = useState<CreateQuartoData>({
    numero: "",
    tipo: "individual",
    capacidade: 1,
    ala: "",
    andar: 1,
    descricao: "",
    observacoes: "",
    valor_mensal: undefined,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero || !formData.ala) {
      toast({
        title: "Erro",
        description: "Número do quarto e ala são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('quartos')
        .insert([{
          numero: formData.numero,
          tipo: formData.tipo,
          capacidade: formData.capacidade,
          ala: formData.ala,
          andar: formData.andar,
          descricao: formData.descricao || null,
          observacoes: formData.observacoes || null,
          valor_mensal: formData.valor_mensal || null,
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Quarto cadastrado com sucesso!",
      });

      // Reset form
      setFormData({
        numero: "",
        tipo: "individual",
        capacidade: 1,
        ala: "",
        andar: 1,
        descricao: "",
        observacoes: "",
        valor_mensal: undefined,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao cadastrar quarto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o quarto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateQuartoData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Quarto</DialogTitle>
          <DialogDescription>
            Preencha as informações do quarto para cadastro no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número do Quarto *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="Ex: 101, A1, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="duplo">Duplo</SelectItem>
                  <SelectItem value="coletivo">Coletivo</SelectItem>
                  <SelectItem value="quarto">Quarto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacidade">Capacidade *</Label>
              <Input
                id="capacidade"
                type="number"
                min="1"
                max="10"
                value={formData.capacidade}
                onChange={(e) => handleInputChange('capacidade', parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="andar">Andar</Label>
              <Input
                id="andar"
                type="number"
                min="1"
                max="10"
                value={formData.andar}
                onChange={(e) => handleInputChange('andar', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ala">Ala *</Label>
            <Input
              id="ala"
              value={formData.ala}
              onChange={(e) => handleInputChange('ala', e.target.value)}
              placeholder="Ex: Ala Masculina, Ala Feminina, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
            <Input
              id="valor_mensal"
              type="text"
              step="0.01"
              min="0"
              value={formData.valor_mensal || ""}
              onChange={(e) => handleInputChange('valor_mensal', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Digite o valor mensal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Breve descrição do quarto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre o quarto"
              rows={3}
            />
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