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

  const handleCancel = () => {
    navigate('/idosos');
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cadastrar Novo Idoso</h1>
            <p className="text-muted-foreground">
              Preencha os dados do idoso para cadastrá-lo no sistema
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Idoso</CardTitle>
            <CardDescription>
              Campos marcados com * são obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    placeholder="Nome completo do idoso"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg || ""}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="Número do RG"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_admissao">Data de Admissão *</Label>
                  <Input
                    id="data_admissao"
                    type="date"
                    value={formData.data_admissao}
                    onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ""}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco || ""}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato_emergencia">Contato de Emergência</Label>
                <Input
                  id="contato_emergencia"
                  value={formData.contato_emergencia || ""}
                  onChange={(e) => setFormData({ ...formData, contato_emergencia: e.target.value })}
                  placeholder="Nome e telefone do contato de emergência"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes_medicas">Observações Médicas</Label>
                <Textarea
                  id="observacoes_medicas"
                  value={formData.observacoes_medicas || ""}
                  onChange={(e) => setFormData({ ...formData, observacoes_medicas: e.target.value })}
                  placeholder="Informações médicas relevantes, medicamentos, alergias, etc..."
                  rows={4}
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

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
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