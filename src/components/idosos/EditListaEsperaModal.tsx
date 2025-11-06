import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DateInput from "@/components/ui/date-input";

interface IdosoListaEspera {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo?: 'masculino' | 'feminino';
  telefone?: string;
  endereco?: string;
  responsavel_nome?: string;
  responsavel_telefone?: string;
  responsavel_parentesco?: string;
  observacoes?: string;
  status: 'aguardando' | 'contatado' | 'transferido' | 'cancelado';
}

interface EditListaEsperaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idoso: IdosoListaEspera;
}

interface FormData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo: '' | 'masculino' | 'feminino';
  telefone: string;
  endereco: string;
  responsavel_nome: string;
  responsavel_telefone: string;
  responsavel_parentesco: string;
  observacoes: string;
  status: string;
}

export function EditListaEsperaModal({ isOpen, onClose, onSuccess, idoso }: EditListaEsperaModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    cpf: "",
    data_nascimento: "",
    sexo: "",
    telefone: "",
    endereco: "",
    responsavel_nome: "",
    responsavel_telefone: "",
    responsavel_parentesco: "",
    observacoes: "",
    status: "aguardando",
  });

  useEffect(() => {
    if (idoso) {
      setFormData({
        nome: idoso.nome || "",
        cpf: formatCPF(idoso.cpf) || "",
        data_nascimento: idoso.data_nascimento || "",
        sexo: idoso.sexo || "",
        telefone: idoso.telefone || "",
        endereco: idoso.endereco || "",
        responsavel_nome: idoso.responsavel_nome || "",
        responsavel_telefone: idoso.responsavel_telefone || "",
        responsavel_parentesco: idoso.responsavel_parentesco || "",
        observacoes: idoso.observacoes || "",
        status: idoso.status || "aguardando",
      });
    }
  }, [idoso]);

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

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return false;
    }
    
    if (!formData.cpf.trim()) {
      toast.error("CPF é obrigatório");
      return false;
    }
    
    if (!formData.data_nascimento) {
      toast.error("Data de nascimento é obrigatória");
      return false;
    }

    // Validar CPF (formato básico)
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Verificar se CPF já existe em outro registro (exceto o atual)
      const { data: existingEspera } = await supabase
        .from('lista_espera_idosos')
        .select('id')
        .eq('cpf', formData.cpf.replace(/\D/g, ''))
        .neq('id', idoso.id)
        .single();

      if (existingEspera) {
        toast.error("CPF já cadastrado em outro registro da lista de espera");
        return;
      }

      const { error } = await supabase
        .from('lista_espera_idosos')
        .update({
          nome: formData.nome.trim(),
          cpf: formData.cpf.replace(/\D/g, ''),
          data_nascimento: formData.data_nascimento,
          sexo: formData.sexo || null,
          telefone: formData.telefone.trim() || null,
          endereco: formData.endereco.trim() || null,
          responsavel_nome: formData.responsavel_nome.trim() || null,
          responsavel_telefone: formData.responsavel_telefone.trim() || null,
          responsavel_parentesco: formData.responsavel_parentesco.trim() || null,
          observacoes: formData.observacoes.trim() || null,
          status: formData.status
        })
        .eq('id', idoso.id);

      if (error) throw error;

      toast.success("Dados atualizados com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error("Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover este idoso da lista de espera?")) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('lista_espera_idosos')
        .delete()
        .eq('id', idoso.id);

      if (error) throw error;

      toast.success("Idoso removido da lista de espera!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao remover da lista:', error);
      toast.error("Erro ao remover da lista de espera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Dados - Lista de Espera</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo do idoso"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
              <DateInput
                id="data_nascimento"
                value={formData.data_nascimento}
                onChange={(value) => setFormData({ ...formData, data_nascimento: value })}
                placeholder="dd/mm/aaaa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value as 'masculino' | 'feminino' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="transferido">Transferido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder="Endereço completo"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Dados do Responsável</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsavel_nome">Nome do Responsável</Label>
                <Input
                  id="responsavel_nome"
                  value={formData.responsavel_nome}
                  onChange={(e) => setFormData({ ...formData, responsavel_nome: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_telefone">Telefone do Responsável</Label>
                <Input
                  id="responsavel_telefone"
                  value={formData.responsavel_telefone}
                  onChange={(e) => setFormData({ ...formData, responsavel_telefone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="responsavel_parentesco">Parentesco</Label>
                <Input
                  id="responsavel_parentesco"
                  value={formData.responsavel_parentesco}
                  onChange={(e) => setFormData({ ...formData, responsavel_parentesco: e.target.value })}
                  placeholder="Ex: Filho(a), Neto(a), Sobrinho(a)"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais, necessidades especiais, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading}
            >
              Remover da Lista
            </Button>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditListaEsperaModal;