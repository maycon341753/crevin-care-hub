import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Departamento {
  id: string;
  nome: string;
}

interface Profile {
  id: string;
  email: string;
  nome: string | null;
  telefone: string | null;
  cargo: string | null;
  departamento_id: string | null;
  ativo: boolean;
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
}

export function EditProfileModal({ open, onClose, profile }: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    telefone: "",
    cargo: "",
    departamento_id: "",
    ativo: true,
  });
  const { toast } = useToast();

  const fetchDepartamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('departamentos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setDepartamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDepartamentos();
    }
  }, [open]);

  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.email,
        nome: profile.nome || "",
        telefone: profile.telefone ? formatPhone(profile.telefone) : "",
        cargo: profile.cargo || "",
        departamento_id: profile.departamento_id || "",
        ativo: profile.ativo,
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.length <= 15) {
      handleInputChange('telefone', formatted);
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast({
        title: "Erro de validação",
        description: "Email é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro de validação",
        description: "Email deve ter um formato válido.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome é obrigatório.",
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

      // Verificar se email já existe em outro registro
      if (formData.email.toLowerCase() !== profile.email.toLowerCase()) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email.toLowerCase())
          .neq('id', profile.id)
          .single();

        if (existingProfile) {
          toast({
            title: "Erro",
            description: "Já existe outro usuário cadastrado com este email.",
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          email: formData.email.toLowerCase().trim(),
          nome: formData.nome.trim(),
          telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null,
          cargo: formData.cargo.trim() || null,
          departamento_id: formData.departamento_id || null,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário cadastrado no sistema.
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
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
                placeholder="Ex: Administrador, Funcionário"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Select
              value={formData.departamento_id}
              onValueChange={(value) => handleInputChange('departamento_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum departamento</SelectItem>
                {departamentos.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => handleInputChange('ativo', checked)}
            />
            <Label htmlFor="ativo">Usuário ativo</Label>
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