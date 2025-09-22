import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

interface Funcionario {
  id: string;
  nome: string;
}

interface AddContaPagarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categorias: CategoriaFinanceira[];
}

const AddContaPagarModal: React.FC<AddContaPagarModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categorias
}) => {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
    categoria_id: '',
    funcionario_id: '',
    fornecedor_nome: '',
    fornecedor_cnpj: '',
    fornecedor_telefone: '',
    forma_pagamento: '',
    observacoes: ''
  });
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFuncionarios();
    }
  }, [isOpen]);

  const fetchFuncionarios = async () => {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar funcionários:', error);
      return;
    }

    setFuncionarios(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.data_vencimento || !formData.categoria_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const contaData = {
        ...formData,
        valor: parseFloat(formData.valor),
        funcionario_id: formData.funcionario_id || null,
        created_by: userData.user?.id || '00000000-0000-0000-0000-000000000000'
      };

      const { error } = await supabase
        .from('contas_pagar')
        .insert([contaData]);

      if (error) {
        console.error('Erro ao criar conta a pagar:', error);
        toast.error('Erro ao criar conta a pagar');
        return;
      }

      toast.success('Conta a pagar criada com sucesso!');
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar conta a pagar');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      data_vencimento: '',
      categoria_id: '',
      funcionario_id: '',
      fornecedor_nome: '',
      fornecedor_cnpj: '',
      fornecedor_telefone: '',
      forma_pagamento: '',
      observacoes: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta a Pagar</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Conta de luz Janeiro 2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="categoria_id">Categoria *</Label>
              <select
                id="categoria_id"
                value={formData.categoria_id}
                onChange={(e) => handleInputChange('categoria_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="funcionario_id">Funcionário Responsável (opcional)</Label>
              <select
                id="funcionario_id"
                value={formData.funcionario_id}
                onChange={(e) => handleInputChange('funcionario_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um funcionário</option>
                {funcionarios.map((funcionario) => (
                  <option key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="fornecedor_nome">Nome do Fornecedor</Label>
              <Input
                id="fornecedor_nome"
                value={formData.fornecedor_nome}
                onChange={(e) => handleInputChange('fornecedor_nome', e.target.value)}
                placeholder="Nome da empresa/pessoa"
              />
            </div>

            <div>
              <Label htmlFor="fornecedor_cnpj">CNPJ/CPF do Fornecedor</Label>
              <Input
                id="fornecedor_cnpj"
                value={formData.fornecedor_cnpj}
                onChange={(e) => handleInputChange('fornecedor_cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <Label htmlFor="fornecedor_telefone">Telefone do Fornecedor</Label>
              <Input
                id="fornecedor_telefone"
                value={formData.fornecedor_telefone}
                onChange={(e) => handleInputChange('fornecedor_telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <select
                id="forma_pagamento"
                value={formData.forma_pagamento}
                onChange={(e) => handleInputChange('forma_pagamento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione a forma</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
                <option value="cheque">Cheque</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContaPagarModal;