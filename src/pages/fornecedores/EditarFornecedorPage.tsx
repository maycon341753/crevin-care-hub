import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Building2, User } from 'lucide-react';

interface FornecedorFormData {
  nome: string;
  razao_social: string;
  cnpj: string;
  cpf: string;
  tipo_pessoa: 'fisica' | 'juridica';
  email: string;
  telefone: string;
  celular: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  categoria: string;
  observacoes: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
}

const EditarFornecedorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FornecedorFormData>({
    nome: '',
    razao_social: '',
    cnpj: '',
    cpf: '',
    tipo_pessoa: 'juridica',
    email: '',
    telefone: '',
    celular: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    categoria: '',
    observacoes: '',
    status: 'ativo'
  });

  const categorias = [
    { value: 'alimentacao', label: 'Alimentação' },
    { value: 'limpeza', label: 'Limpeza' },
    { value: 'medicamentos', label: 'Medicamentos' },
    { value: 'servicos', label: 'Serviços' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'equipamentos', label: 'Equipamentos' },
    { value: 'outros', label: 'Outros' }
  ];

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    if (id) {
      fetchFornecedor();
    }
  }, [id]);

  const fetchFornecedor = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar fornecedor:', error);
        toast.error('Erro ao carregar dados do fornecedor');
        navigate('/fornecedores');
        return;
      }

      if (data) {
        setFormData({
          nome: data.nome || '',
          razao_social: data.razao_social || '',
          cnpj: data.cnpj || '',
          cpf: data.cpf || '',
          tipo_pessoa: data.tipo_pessoa || 'juridica',
          email: data.email || '',
          telefone: data.telefone || '',
          celular: data.celular || '',
          endereco: data.endereco || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          cep: data.cep || '',
          categoria: data.categoria || '',
          observacoes: data.observacoes || '',
          status: data.status || 'ativo'
        });
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar fornecedor');
      navigate('/fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FornecedorFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
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
      toast.error('Nome é obrigatório');
      return false;
    }

    if (formData.tipo_pessoa === 'juridica' && !formData.cnpj.trim()) {
      toast.error('CNPJ é obrigatório para pessoa jurídica');
      return false;
    }

    if (formData.tipo_pessoa === 'fisica' && !formData.cpf.trim()) {
      toast.error('CPF é obrigatório para pessoa física');
      return false;
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Email inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) return;

    try {
      setSaving(true);

      const updateData = {
        nome: formData.nome.trim(),
        razao_social: formData.razao_social.trim() || null,
        cnpj: formData.tipo_pessoa === 'juridica' ? formData.cnpj.replace(/\D/g, '') : null,
        cpf: formData.tipo_pessoa === 'fisica' ? formData.cpf.replace(/\D/g, '') : null,
        tipo_pessoa: formData.tipo_pessoa,
        email: formData.email.trim() || null,
        telefone: formData.telefone.replace(/\D/g, '') || null,
        celular: formData.celular.replace(/\D/g, '') || null,
        endereco: formData.endereco.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado: formData.estado || null,
        cep: formData.cep.replace(/\D/g, '') || null,
        categoria: formData.categoria || null,
        observacoes: formData.observacoes.trim() || null,
        status: formData.status,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('fornecedores')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        toast.error('Erro ao atualizar fornecedor: ' + error.message);
        return;
      }

      toast.success('Fornecedor atualizado com sucesso!');
      navigate('/fornecedores');
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao atualizar fornecedor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando dados do fornecedor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/fornecedores')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Editar Fornecedor
          </h1>
          <p className="text-gray-600 mt-1">
            Atualize as informações do fornecedor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Básicas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {formData.tipo_pessoa === 'juridica' ? (
                    <Building2 className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_pessoa">Tipo de Pessoa *</Label>
                    <Select
                      value={formData.tipo_pessoa}
                      onValueChange={(value: 'fisica' | 'juridica') => 
                        handleInputChange('tipo_pessoa', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                        <SelectItem value="fisica">Pessoa Física</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'ativo' | 'inativo' | 'bloqueado') => 
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome">Nome/Nome Fantasia *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Digite o nome do fornecedor"
                    required
                  />
                </div>

                {formData.tipo_pessoa === 'juridica' && (
                  <div>
                    <Label htmlFor="razao_social">Razão Social</Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) => handleInputChange('razao_social', e.target.value)}
                      placeholder="Digite a razão social"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.tipo_pessoa === 'juridica' ? (
                    <div>
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => handleInputChange('categoria', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.value} value={categoria.value}>
                            {categoria.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contato */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                    placeholder="(00) 0000-0000"
                    maxLength={15}
                  />
                </div>

                <div>
                  <Label htmlFor="celular">Celular</Label>
                  <Input
                    id="celular"
                    value={formData.celular}
                    onChange={(e) => handleInputChange('celular', formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Endereço */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                      placeholder="Digite a cidade"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => handleInputChange('estado', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleInputChange('cep', formatCEP(e.target.value))}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre o fornecedor..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/fornecedores')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarFornecedorPage;