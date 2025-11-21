import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DateInput from '@/components/ui/date-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatSalaryInput, parseBrazilianCurrency } from '@/lib/utils';

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
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
    fornecedor_nome: '',
    fornecedor_cnpj: '',
    fornecedor_telefone: '',
    forma_pagamento: '',
    observacoes: '',
    recorrente: false,
    frequencia_recorrencia: 'mensal'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        descricao: '',
        valor: '',
        data_vencimento: '',
        categoria_id: '',
        fornecedor_nome: '',
        fornecedor_cnpj: '',
        fornecedor_telefone: '',
        forma_pagamento: '',
        observacoes: '',
        recorrente: false,
        frequencia_recorrencia: 'mensal'
      });
    }
  }, [isOpen]);

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
        valor: parseBrazilianCurrency(formData.valor),
        created_by: userData.user?.id || '00000000-0000-0000-0000-000000000000'
      };

      // Se for recorrente, adicionar campos específicos
      if (formData.recorrente) {
        const dataVencimento = new Date(formData.data_vencimento);
        const proximaGeracao = new Date(dataVencimento);
        
        // Calcular próxima data baseada na frequência
        switch (formData.frequencia_recorrencia) {
          case 'mensal':
            proximaGeracao.setMonth(proximaGeracao.getMonth() + 1);
            break;
          case 'bimestral':
            proximaGeracao.setMonth(proximaGeracao.getMonth() + 2);
            break;
          case 'trimestral':
            proximaGeracao.setMonth(proximaGeracao.getMonth() + 3);
            break;
          case 'semestral':
            proximaGeracao.setMonth(proximaGeracao.getMonth() + 6);
            break;
          case 'anual':
            proximaGeracao.setFullYear(proximaGeracao.getFullYear() + 1);
            break;
        }
        
        contaData.data_proxima_geracao = proximaGeracao.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('contas_pagar')
        .insert([contaData]);

      if (error) {
        console.error('Erro ao criar conta a pagar:', error);
        toast.error('Erro ao criar conta a pagar');
        return;
      }

      toast.success(
        formData.recorrente 
          ? 'Conta recorrente criada com sucesso! As próximas parcelas serão geradas automaticamente.'
          : 'Conta a pagar criada com sucesso!'
      );
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
      fornecedor_nome: '',
      fornecedor_cnpj: '',
      fornecedor_telefone: '',
      forma_pagamento: '',
      observacoes: '',
      recorrente: false,
      frequencia_recorrencia: 'mensal'
    });
  };

  const handleInputChange = (field: string, value: string) => {
    // Aplicar formatação especial para o campo valor sem inserir zeros à esquerda
    if (field === 'valor') {
      const formattedValue = formatSalaryInput(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
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
                type="text"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                placeholder="Digite o valor em reais"
                required
              />
            </div>

            <DateInput
              id="data_vencimento"
              label="Data de Vencimento"
              value={formData.data_vencimento}
              onChange={(value) => handleInputChange('data_vencimento', value)}
              required
            />

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

            {/* Campos de Recorrência */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recorrente"
                  checked={formData.recorrente}
                  onChange={(e) => handleCheckboxChange('recorrente', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="recorrente" className="text-sm font-medium text-gray-700">
                  Esta conta é recorrente
                </Label>
              </div>
            </div>

            {formData.recorrente && (
              <div className="md:col-span-2">
                <Label htmlFor="frequencia_recorrencia">Frequência de Recorrência</Label>
                <select
                  id="frequencia_recorrencia"
                  value={formData.frequencia_recorrencia}
                  onChange={(e) => handleInputChange('frequencia_recorrencia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mensal">Mensal</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            )}
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