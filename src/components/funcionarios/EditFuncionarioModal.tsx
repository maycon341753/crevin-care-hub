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
import { formatCPF, formatPhone, formatBrazilianSalary, parseBrazilianSalary, isValidBrazilianSalary } from "@/lib/utils";
import DateInput from '@/components/ui/date-input';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  console.log('EditFuncionarioModal renderizado com:', { open, funcionario: !!funcionario });
  
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

  const [departamentos, setDepartamentos] = useState<Array<{id: string, nome: string}>>([]);

  // Carregar departamentos
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const { data, error } = await supabase
          .from('departamentos')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');
        
        if (error) {
          console.error('Erro ao carregar departamentos:', error);
          // Usar departamentos padrão se houver erro
          setDepartamentos([
            { id: 'dept-1', nome: 'Enfermagem' },
            { id: 'dept-2', nome: 'Cuidados' },
            { id: 'dept-3', nome: 'Nutrição' },
            { id: 'dept-4', nome: 'Transporte' },
            { id: 'dept-5', nome: 'Administração' }
          ]);
        } else {
          setDepartamentos(data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
        // Usar departamentos padrão em caso de erro
        setDepartamentos([
          { id: 'dept-1', nome: 'Enfermagem' },
          { id: 'dept-2', nome: 'Cuidados' },
          { id: 'dept-3', nome: 'Nutrição' },
          { id: 'dept-4', nome: 'Transporte' },
          { id: 'dept-5', nome: 'Administração' }
        ]);
      }
    };

    if (open) {
      fetchDepartamentos();
    }
  }, [open]);

  const [isLoading, setIsLoading] = useState(false);

  // Preenche o formulário quando o funcionário é selecionado
  useEffect(() => {
    if (funcionario) {
      console.log('Dados do funcionário recebidos:', funcionario);
      console.log('Data de admissão original:', funcionario.data_admissao);
      
      // Garantir que a data esteja no formato correto para o input (YYYY-MM-DD)
      let dataAdmissaoFormatted = funcionario.data_admissao;
      if (funcionario.data_admissao) {
        // Se a data vier no formato ISO com timezone, extrair apenas a parte da data
        if (funcionario.data_admissao.includes('T')) {
          dataAdmissaoFormatted = funcionario.data_admissao.split('T')[0];
        }
        // Se a data vier no formato DD/MM/AAAA, converter para YYYY-MM-DD
        else if (funcionario.data_admissao.includes('/')) {
          const parts = funcionario.data_admissao.split('/');
          if (parts.length === 3) {
            dataAdmissaoFormatted = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
      
      console.log('Data de admissão formatada para input:', dataAdmissaoFormatted);
      
      setFormData({
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        telefone: funcionario.telefone,
        email: funcionario.email,
        cargo: funcionario.cargo,
        departamento_id: funcionario.departamento_id || '', // Garantir que não seja undefined
        salario: funcionario.salario ? formatSalaryInput(funcionario.salario.toString()) : "",
        data_admissao: dataAdmissaoFormatted,
        status: funcionario.status,
      });
    }
  }, [funcionario]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'salario') {
      const formatted = formatSalaryInput(value);
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario) return;

    // Validação do departamento_id
    if (!formData.departamento_id || formData.departamento_id.trim() === '') {
      toast.error('Por favor, selecione um departamento');
      return;
    }

    setIsLoading(true);

    try {
      // Atualizar funcionário no Supabase
      const { error } = await supabase
        .from('funcionarios')
        .update({
          nome: formData.nome,
          cpf: formData.cpf.replace(/\D/g, ''), // Remove formatação do CPF
          telefone: formData.telefone.replace(/\D/g, ''), // Remove formatação do telefone
          email: formData.email || null,
          cargo: formData.cargo,
          departamento_id: formData.departamento_id, // Removido o || null
          salario: formData.salario ? parseBrazilianSalary(formData.salario) : null,
          data_admissao: formData.data_admissao,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', funcionario.id);

      if (error) throw error;

      const updatedFuncionario: Funcionario = {
        ...funcionario,
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        email: formData.email,
        cargo: formData.cargo,
        departamento_id: formData.departamento_id,
        salario: formData.salario ? parseBrazilianSalary(formData.salario) : 0,
        data_admissao: formData.data_admissao,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      onSuccess(updatedFuncionario);
      toast.success('Funcionário atualizado com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar funcionário:", error);
      toast.error(error.message || 'Erro ao atualizar funcionário');
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Funcionário
          </DialogTitle>
          <DialogDescription>
            {funcionario ? `Atualize as informações do funcionário ${funcionario.nome}` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {!funcionario ? (
          <div className="flex justify-center items-center py-8">
            <p>Carregando dados do funcionário...</p>
          </div>
        ) : (
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
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="funcionario@crevin.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="(61) 99999-9999"
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
                  onValueChange={(value) => {
                    console.log('Departamento selecionado:', value); // Debug
                    handleInputChange("departamento_id", value);
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salario">Salário *</Label>
                <Input
                  id="salario"
                  type="text"
                  value={formData.salario}
                  onChange={(e) => handleInputChange("salario", e.target.value)}
                  placeholder="Digite o salário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_admissao">Data de Admissão *</Label>
                <DateInput
                  id="data_admissao"
                  value={formData.data_admissao}
                  onChange={(value) => handleInputChange("data_admissao", value)}
                  required
                  placeholder="dd/mm/aaaa"
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
        )}
      </DialogContent>
    </Dialog>
  );
}