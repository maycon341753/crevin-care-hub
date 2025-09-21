import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Funcionario } from "@/types";
import { Edit } from "lucide-react";

interface EditFuncionarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: Funcionario | null;
  onSuccess: (funcionario: Funcionario) => void;
}

export function EditFuncionarioModal({
  open,
  onOpenChange,
  funcionario,
  onSuccess,
}: EditFuncionarioModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    cargo: "",
    departamento_id: "",
    salario: "",
    data_admissao: "",
    status: "ativo",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Preenche o formulário quando o funcionário é selecionado
  useEffect(() => {
    if (funcionario) {
      setFormData({
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        telefone: funcionario.telefone,
        email: funcionario.email,
        cargo: funcionario.cargo,
        departamento_id: funcionario.departamento_id,
        salario: funcionario.salario.toString(),
        data_admissao: funcionario.data_admissao,
        status: funcionario.status,
      });
    }
  }, [funcionario]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario) return;

    setIsLoading(true);

    try {
      // Simula uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedFuncionario: Funcionario = {
        ...funcionario,
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        email: formData.email,
        cargo: formData.cargo,
        departamento_id: formData.departamento_id,
        salario: parseFloat(formData.salario),
        data_admissao: formData.data_admissao,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      onSuccess(updatedFuncionario);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      cargo: "",
      departamento_id: "",
      salario: "",
      data_admissao: "",
      status: "ativo",
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  if (!funcionario) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Funcionário
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do funcionário {funcionario.nome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="funcionario@crevin.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="(61) 99999-9999"
                  required
                />
              </div>
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Profissionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange("cargo", e.target.value)}
                  placeholder="Ex: Técnico de Enfermagem"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento *</Label>
                <Select
                  value={formData.departamento_id}
                  onValueChange={(value) => handleInputChange("departamento_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dept-1">Enfermagem</SelectItem>
                    <SelectItem value="dept-2">Cuidados</SelectItem>
                    <SelectItem value="dept-3">Nutrição</SelectItem>
                    <SelectItem value="dept-4">Transporte</SelectItem>
                    <SelectItem value="dept-5">Administração</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salario">Salário *</Label>
                <Input
                  id="salario"
                  type="number"
                  step="0.01"
                  value={formData.salario}
                  onChange={(e) => handleInputChange("salario", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_admissao">Data de Admissão *</Label>
                <Input
                  id="data_admissao"
                  type="date"
                  value={formData.data_admissao}
                  onChange={(e) => handleInputChange("data_admissao", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="licenca">Licença</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}