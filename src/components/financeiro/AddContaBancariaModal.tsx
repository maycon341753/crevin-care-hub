import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddContaBancariaModalProps {
  onContaAdded?: () => void;
}

const AddContaBancariaModal: React.FC<AddContaBancariaModalProps> = ({ onContaAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    banco: '',
    agencia: '',
    conta: '',
    saldo_atual: '',
    ativo: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.banco || !formData.agencia || !formData.conta) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('contas_bancarias')
        .insert([{
          nome: formData.nome,
          banco: formData.banco,
          agencia: formData.agencia,
          conta: formData.conta,
          saldo_atual: parseFloat(formData.saldo_atual) || 0,
          ativo: formData.ativo
        }]);

      if (error) throw error;

      toast.success('Conta bancária adicionada com sucesso!');
      setOpen(false);
      setFormData({
        nome: '',
        banco: '',
        agencia: '',
        conta: '',
        saldo_atual: '',
        ativo: true
      });
      
      if (onContaAdded) {
        onContaAdded();
      }
    } catch (error) {
      console.error('Erro ao adicionar conta bancária:', error);
      toast.error('Erro ao adicionar conta bancária');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Building2 className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Adicionar Conta Bancária
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="nome">Nome da Conta *</Label>
              <Input
                id="nome"
                placeholder="Ex: Conta Corrente Principal"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="banco">Banco *</Label>
              <Input
                id="banco"
                placeholder="Ex: Banco do Brasil, Itaú, Bradesco"
                value={formData.banco}
                onChange={(e) => handleInputChange('banco', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agencia">Agência *</Label>
                <Input
                  id="agencia"
                  placeholder="Ex: 1234-5"
                  value={formData.agencia}
                  onChange={(e) => handleInputChange('agencia', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="conta">Conta *</Label>
                <Input
                  id="conta"
                  placeholder="Ex: 12345-6"
                  value={formData.conta}
                  onChange={(e) => handleInputChange('conta', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="saldo_atual">Saldo Atual (R$)</Label>
              <Input
                id="saldo_atual"
                type="text"
                placeholder="Digite o saldo atual"
                value={formData.saldo_atual}
                onChange={(e) => handleInputChange('saldo_atual', e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => handleInputChange('ativo', checked)}
              />
              <Label htmlFor="ativo">Conta ativa</Label>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContaBancariaModal;