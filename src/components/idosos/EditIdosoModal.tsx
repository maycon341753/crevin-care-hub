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
import { Loader2 } from "lucide-react";

interface Idoso {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string | null;
  endereco: string | null;
  contato_emergencia: string | null;
  observacoes: string | null;
  ativo: boolean;
}

interface EditIdosoModalProps {
  open: boolean;
  onClose: () => void;
  idoso: Idoso;
}

export function EditIdosoModal({ open, onClose, idoso }: EditIdosoModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    data_nascimento: "",
    telefone: "",
    endereco: "",
    contato_emergencia: "",
    observacoes: "",
    ativo: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (idoso) {
      setFormData({
        nome: idoso.nome,
        cpf: formatCPF(idoso.cpf),
        data_nascimento: idoso.data_nascimento,
        telefone: idoso.telefone ? formatPhone(idoso.telefone) : "",
        endereco: idoso.endereco || "",
        contato_emergencia: idoso.contato_emergencia || "",
        observacoes: idoso.observacoes || "",
        ativo: idoso.ativo,
      });
    }
  }, [idoso]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    if (formatted.length <= 14) {
      handleInputChange('cpf', formatted);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.length <= 15) {
      handleInputChange('telefone', formatted);
    }
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.cpf.trim()) {
      toast({
        title: "Erro de validação",
        description: "CPF é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    // Validação básica de CPF (11 dígitos)
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      toast({
        title: "Erro de validação",
        description: "CPF deve ter 11 dígitos.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.data_nascimento) {
      toast({
        title: "Erro de validação",
        description: "Data de nascimento é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    // Validar se a data não é futura
    const birthDate = new Date(formData.data_nascimento);
    const today = new Date();
    if (birthDate > today) {
      toast({
        title: "Erro de validação",
        description: "Data de nascimento não pode ser futura.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Verificar se CPF já existe em outro registro
      const cpfNumbers = formData.cpf.replace(/\D/g, '');
      if (cpfNumbers !== idoso.cpf) {
        const { data: existingIdoso } = await supabase
          .from('idosos')
          .select('id')
          .eq('cpf', cpfNumbers)
          .neq('id', idoso.id)
          .single();

        if (existingIdoso) {
          toast({
            title: "Erro",
            description: "Já existe outro idoso cadastrado com este CPF.",
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase
        .from('idosos')
        .update({
          nome: formData.nome.trim(),
          cpf: formData.cpf.replace(/\D/g, ''),
          data_nascimento: formData.data_nascimento,
          telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null,
          endereco: formData.endereco.trim() || null,
          contato_emergencia: formData.contato_emergencia.trim() || null,
          observacoes: formData.observacoes.trim() || null,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', idoso.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Idoso atualizado com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao atualizar idoso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o idoso.",
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
          <DialogTitle>Editar Idoso</DialogTitle>
          <DialogDescription>
            Atualize as informações do idoso cadastrado no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Nome completo do idoso"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => handleInputChange('endereco', e.target.value)}
              placeholder="Endereço completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contato_emergencia">Contato de Emergência</Label>
            <Input
              id="contato_emergencia"
              value={formData.contato_emergencia}
              onChange={(e) => handleInputChange('contato_emergencia', e.target.value)}
              placeholder="Nome e telefone do contato de emergência"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre o idoso"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => handleInputChange('ativo', checked)}
            />
            <Label htmlFor="ativo">Idoso ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}