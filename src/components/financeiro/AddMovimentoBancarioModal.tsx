import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpDown, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrencyInput, parseBrazilianCurrency, formatBrazilianCurrency } from "@/lib/utils";
import DateInput from '@/components/ui/date-input';

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_atual: number;
}

interface AddMovimentoBancarioModalProps {
  onMovimentoAdded?: () => void;
}

const AddMovimentoBancarioModal: React.FC<AddMovimentoBancarioModalProps> = ({
  onMovimentoAdded
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    conta_bancaria_id: '',
    data_movimento: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    documento: '',
    observacoes: ''
  });
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchContasBancarias();
      resetForm();
    }
  }, [open]);

  const fetchContasBancarias = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setContasBancarias(data || []);
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      toast.error('Erro ao carregar contas bancárias');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      conta_bancaria_id: '',
      data_movimento: new Date().toISOString().split('T')[0],
      descricao: '',
      valor: '',
      tipo: 'entrada',
      documento: '',
      observacoes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.conta_bancaria_id || !formData.descricao || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    
    try {
      const valorNumerico = parseBrazilianCurrency(formData.valor);
      
      if (valorNumerico <= 0) {
        toast.error('O valor deve ser maior que zero');
        return;
      }

      const { error } = await supabase
        .from('movimentos_bancarios')
        .insert([{
          conta_bancaria_id: formData.conta_bancaria_id,
          data_movimento: formData.data_movimento,
          descricao: formData.descricao,
          valor: valorNumerico,
          tipo: formData.tipo,
          documento: formData.documento || null,
          observacoes: formData.observacoes || null,
          status_conciliacao: 'pendente',
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        }]);

      if (error) throw error;

      toast.success('Movimento bancário adicionado com sucesso!');
      if (onMovimentoAdded) onMovimentoAdded();
      setOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar movimento bancário:', error);
      toast.error('Erro ao adicionar movimento bancário');
    } finally {
      setLoading(false);
    }
  };

  const contaSelecionada = contasBancarias.find(conta => conta.id === formData.conta_bancaria_id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Movimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Nova Movimentação Bancária
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="conta_bancaria_id">Conta Bancária *</Label>
              <select
                id="conta_bancaria_id"
                value={formData.conta_bancaria_id}
                onChange={(e) => handleInputChange('conta_bancaria_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma conta bancária</option>
                {contasBancarias.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} - {conta.banco} (Ag: {conta.agencia}, Conta: {conta.conta})
                  </option>
                ))}
              </select>
              {contaSelecionada && (
                <p className="text-sm text-gray-600 mt-1">
                  Saldo atual: {formatBrazilianCurrency(contaSelecionada.saldo_atual)}
                </p>
              )}
            </div>

            <DateInput
              id="data_movimento"
              label="Data do Movimento"
              value={formData.data_movimento}
              onChange={(value) => handleInputChange('data_movimento', value)}
              required
            />

            <div>
              <Label htmlFor="tipo">Tipo de Movimento *</Label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value as 'entrada' | 'saida')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="entrada">Entrada (+)</option>
                <option value="saida">Saída (-)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Depósito de doação, Pagamento de fornecedor"
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

            <div>
              <Label htmlFor="documento">Número do Documento</Label>
              <Input
                id="documento"
                value={formData.documento}
                onChange={(e) => handleInputChange('documento', e.target.value)}
                placeholder="Ex: Cheque 123456, DOC 789"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o movimento..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Movimento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMovimentoBancarioModal;