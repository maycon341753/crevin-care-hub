import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DateInput from '@/components/ui/date-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrencyInput, parseBrazilianCurrency } from '@/lib/utils';
import { useAdministradores } from '@/hooks/useAdministradores';

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

interface AddContaReceberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categorias: CategoriaFinanceira[];
}

const AddContaReceberModal: React.FC<AddContaReceberModalProps> = ({
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
    administrador_id: '',
    idoso_id: '',
    pagador_nome: '',
    pagador_cpf: '',
    pagador_telefone: '',
    forma_pagamento: '',
    observacoes: ''
  });
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const { administradores, loading: loadingAdmins } = useAdministradores();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchIdosos();
    }
  }, [isOpen]);

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
    
    if (!formData.descricao || !formData.valor || !formData.data_vencimento || !formData.categoria_id) {
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
      const { data: userData } = await supabase.auth.getUser();
      
      const contaData = {
        ...formData,
        valor: parseBrazilianCurrency(formData.valor), // Converte valor brasileiro para número
        idoso_id: formData.idoso_id || null,
        created_by: userData.user?.id || '00000000-0000-0000-0000-000000000000'
      };

      const { error } = await supabase
        .from('contas_receber')
        .insert([contaData]);

      if (error) {
        console.error('Erro ao criar conta a receber:', error);
        toast.error('Erro ao criar conta a receber');
        return;
      }

      toast.success('Conta a receber criada com sucesso!');
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar conta a receber');
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
      idoso_id: '',
      pagador_nome: '',
      pagador_cpf: '',
      pagador_telefone: '',
      forma_pagamento: '',
      observacoes: ''
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta a Receber</DialogTitle>
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

export default AddContaReceberModal;