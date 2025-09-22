import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrencyInput, parseBrazilianCurrency, isValidBrazilianCurrency, formatBrazilianCurrency } from '@/lib/utils';

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

interface Idoso {
  id: string;
  nome: string;
}

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria_id: string;
  idoso_id?: string;
  pagador_nome?: string;
  pagador_cpf?: string;
  pagador_telefone?: string;
  forma_pagamento?: string;
  observacoes?: string;
  status: 'pendente' | 'pago' | 'vencido';
}

interface EditContaReceberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  conta: ContaReceber | null;
  categorias: CategoriaFinanceira[];
}

const EditContaReceberModal: React.FC<EditContaReceberModalProps> = ({
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
    idoso_id: '',
    pagador_nome: '',
    pagador_cpf: '',
    pagador_telefone: '',
    forma_pagamento: '',
    observacoes: '',
    status: 'pendente' as 'pendente' | 'pago' | 'vencido'
  });
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && conta) {
      setFormData({
        descricao: conta.descricao,
        valor: formatBrazilianCurrency(conta.valor), // Formatar valor para exibição brasileira
        data_vencimento: conta.data_vencimento,
        categoria_id: conta.categoria_id,
        idoso_id: conta.idoso_id || '',
        pagador_nome: conta.pagador_nome || '',
        pagador_cpf: conta.pagador_cpf || '',
        pagador_telefone: conta.pagador_telefone || '',
        forma_pagamento: conta.forma_pagamento || '',
        observacoes: conta.observacoes || '',
        status: conta.status
      });
      fetchIdosos();
    }
  }, [isOpen, conta]);

  const fetchIdosos = async () => {
    const { data, error } = await supabase
      .from('idosos')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar idosos:', error);
      return;
    }

    setIdosos(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conta || !formData.descricao || !formData.valor || !formData.data_vencimento || !formData.categoria_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar formato do valor
    if (!isValidBrazilianCurrency(formData.valor)) {
      toast.error('Formato de valor inválido. Use o formato brasileiro (ex: 1234,78)');
      return;
    }

    setLoading(true);

    try {
      const contaData = {
        ...formData,
        valor: parseBrazilianCurrency(formData.valor), // Converte valor brasileiro para número
        idoso_id: formData.idoso_id || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('contas_receber')
        .update(contaData)
        .eq('id', conta.id);

      if (error) {
        console.error('Erro ao atualizar conta a receber:', error);
        toast.error('Erro ao atualizar conta a receber');
        return;
      }

      toast.success('Conta a receber atualizada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar conta a receber');
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
        .from('contas_receber')
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
          <DialogTitle>Editar Conta a Receber</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Mensalidade Janeiro 2025"
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
                placeholder="1234,78"
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
              <Label htmlFor="idoso_id">Idoso (opcional)</Label>
              <select
                id="idoso_id"
                value={formData.idoso_id}
                onChange={(e) => handleInputChange('idoso_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um idoso</option>
                {idosos.map((idoso) => (
                  <option key={idoso.id} value={idoso.id}>
                    {idoso.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="pagador_nome">Nome do Pagador</Label>
              <Input
                id="pagador_nome"
                value={formData.pagador_nome}
                onChange={(e) => handleInputChange('pagador_nome', e.target.value)}
                placeholder="Nome de quem vai pagar"
              />
            </div>

            <div>
              <Label htmlFor="pagador_cpf">CPF do Pagador</Label>
              <Input
                id="pagador_cpf"
                value={formData.pagador_cpf}
                onChange={(e) => handleInputChange('pagador_cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="pagador_telefone">Telefone do Pagador</Label>
              <Input
                id="pagador_telefone"
                value={formData.pagador_telefone}
                onChange={(e) => handleInputChange('pagador_telefone', e.target.value)}
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

export default EditContaReceberModal;