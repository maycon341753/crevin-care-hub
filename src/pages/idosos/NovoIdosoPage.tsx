import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Idoso } from "@/types";
import { ArrowLeft } from "lucide-react";

export function NovoIdosoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    data_admissao: new Date().toISOString().split('T')[0], // Data atual como padrão
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar se o usuário está logado
      if (!user?.id) {
        throw new Error('Usuário não está logado');
      }

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
          data_admissao: formData.data_admissao || new Date().toISOString().split('T')[0],
          created_by: user.id, // Adicionar o ID do usuário logado
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Idoso cadastrado com sucesso!",
      });

      // Redirecionar para a lista de idosos após o cadastro
      navigate('/idosos');
    } catch (error) {
      console.error('Erro ao cadastrar idoso:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível cadastrar o idoso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/idosos")}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Cadastrar Novo Idoso</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Preencha as informações do idoso para cadastro no sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="crevin-card">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Informações Pessoais</CardTitle>
            <CardDescription className="text-sm">
              Dados básicos do idoso para identificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="nome" className="text-sm font-medium">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Digite o nome completo"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf" className="text-sm font-medium">
                    CPF *
                  </Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="rg" className="text-sm font-medium">
                    RG
                  </Label>
                  <Input
                    id="rg"
                    name="rg"
                    value={formData.rg || ""}
                    onChange={handleInputChange}
                    placeholder="Número do RG"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="data_nascimento" className="text-sm font-medium">
                    Data de Nascimento *
                  </Label>
                  <Input
                    id="data_nascimento"
                    name="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone" className="text-sm font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={formData.telefone || ""}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="data_admissao" className="text-sm font-medium">
                    Data de Admissão *
                  </Label>
                  <Input
                    id="data_admissao"
                    name="data_admissao"
                    type="date"
                    value={formData.data_admissao}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Endereço</h3>
                <div className="grid gap-4 sm:gap-6 grid-cols-1">
                  <div>
                    <Label htmlFor="endereco" className="text-sm font-medium">
                      Endereço Completo
                    </Label>
                    <Input
                      id="endereco"
                      name="endereco"
                      value={formData.endereco || ""}
                      onChange={handleInputChange}
                      placeholder="Rua, número, bairro, cidade - UF"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Contato de Emergência */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Contato de Emergência</h3>
                <div className="grid gap-4 sm:gap-6 grid-cols-1">
                  <div>
                    <Label htmlFor="contato_emergencia" className="text-sm font-medium">
                      Contato de Emergência
                    </Label>
                    <Input
                      id="contato_emergencia"
                      name="contato_emergencia"
                      value={formData.contato_emergencia || ""}
                      onChange={handleInputChange}
                      placeholder="Nome e telefone do contato de emergência"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Observações Médicas</h3>
                <div>
                  <Label htmlFor="observacoes_medicas" className="text-sm font-medium">
                    Observações Médicas
                  </Label>
                  <Textarea
                    id="observacoes_medicas"
                    name="observacoes_medicas"
                    value={formData.observacoes_medicas || ""}
                    onChange={handleInputChange}
                    placeholder="Informações médicas relevantes, medicamentos, alergias, etc..."
                    rows={4}
                    className="mt-1 resize-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Status</h3>
                <div>
                  <Label htmlFor="ativo" className="text-sm font-medium">
                    Status do Idoso
                  </Label>
                  <Select
                    value={formData.ativo ? "true" : "false"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, ativo: value === "true" }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/idosos")}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto sm:ml-auto bg-gradient-primary hover:bg-primary-hover"
                >
                  {loading ? "Cadastrando..." : "Cadastrar Idoso"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}