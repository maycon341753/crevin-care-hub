import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DateInput from '@/components/ui/date-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrencyInput, parseBrazilianCurrency, formatBrazilianCurrencyValue } from '@/lib/utils';
import { useAdministradores } from '@/hooks/useAdministradores';

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria_id: string;
  administrador_id?: string;
  fornecedor_nome?: string;
  fornecedor_cnpj?: string;
  fornecedor_telefone?: string;
  forma_pagamento?: string;
  observacoes?: string;
  status: 'pendente' | 'pago' | 'vencido';
}

interface EditContaPagarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  conta: ContaPagar | null;
  categorias: CategoriaFinanceira[];
}

const EditContaPagarModal: React.FC<EditContaPagarModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  conta,
  categorias
}) => {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
    categoria_id: '',
    administrador_id: '',
    fornecedor_nome: '',
    fornecedor_cnpj: '',
    fornecedor_telefone: '',
    forma_pagamento: '',
    observacoes: '',
    status: 'pendente' as 'pendente' | 'pago' | 'vencido'
  });
  const { administradores, loading: loadingAdmins } = useAdministradores();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && conta) {
      setFormData({
        descricao: conta.descricao,
        valor: formatBrazilianCurrencyValue(conta.valor),
        data_vencimento: conta.data_vencimento,
        categoria_id: conta.categoria_id,
        administrador_id: conta.administrador_id || '',
        fornecedor_nome: conta.fornecedor_nome || '',
        fornecedor_cnpj: conta.fornecedor_cnpj || '',
        fornecedor_telefone: conta.fornecedor_telefone || '',
        forma_pagamento: conta.forma_pagamento || '',
        observacoes: conta.observacoes || '',
        status: conta.status
      });
    }
  }, [isOpen, conta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conta || !formData.descricao || !formData.valor || !formData.data_vencimento || !formData.categoria_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const contaData = {
        ...formData,
        valor: parseBrazilianCurrency(formData.valor),
        funcionario_id: formData.funcionario_id || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('contas_pagar')
        .update(contaData)
        .eq('id', conta.id);

      if (error) {
        console.error('Erro ao atualizar conta a pagar:', error);
        toast.error('Erro ao atualizar conta a pagar');
        return;
      }

      toast.success('Conta a pagar atualizada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar conta a pagar');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Aplicar formatação especial para o campo valor
    if (field === 'valor') {
      const formattedValue = formatCurrencyInput(value);
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

  const marcarComoPago = async () => {
    if (!conta) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('contas_pagar')
        .update({ 
          status: 'pago',
          data_pagamento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conta.id);

      if (error) {
        console.error('Erro ao marcar como pago:', error);
        toast.error('Erro ao marcar como pago');
        return;
      }

      toast.success('Conta marcada como paga!');
      onSuccess();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao marcar como pago');
    } finally {
      setLoading(false);
    }
  };

  if (!conta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conta a Pagar</DialogTitle>
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
                placeholder="0,00"
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
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>

            <div>
              <Label htmlFor="administrador_id">Administrador Responsável (opcional)</Label>
              <select
                id="administrador_id"
                value={formData.administrador_id}
                onChange={(e) => handleInputChange('administrador_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingAdmins}
              >
                <option value="">Selecione um administrador</option>
                {administradores.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.nome}
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

          <div className="flex justify-between pt-4">
            <div>
              {conta.status !== 'pago' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={marcarComoPago}
                  disabled={loading}
                  className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                >
                  Marcar como Pago
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContaPagarModal;