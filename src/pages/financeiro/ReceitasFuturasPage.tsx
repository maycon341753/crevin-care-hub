import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatBrazilianCurrency, formatBrazilianDate } from '@/lib/utils';
import DateInput from '@/components/ui/date-input';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface Idoso {
  id: string;
  nome: string;
  ativo: boolean;
  beneficio_tipo?: 'aposentadoria' | 'loas' | 'bpc' | null;
  beneficio_valor?: number | null;
  contribuicao_percentual?: number | null;
}

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

interface ContaReceberResumo {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
}

const ReceitasFuturasPage: React.FC = () => {
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesReferencia, setMesReferencia] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [categoriaMensalidades, setCategoriaMensalidades] = useState<CategoriaFinanceira | null>(null);
  const [receitasMes, setReceitasMes] = useState<ContaReceberResumo[]>([]);
  const [loadingReceitas, setLoadingReceitas] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: idososData, error: idososError } = await supabase
        .from('idosos')
        .select('id, nome, ativo, beneficio_tipo, beneficio_valor, contribuicao_percentual')
        .eq('ativo', true)
        .order('nome');

      if (idososError) throw idososError;

      const { data: categoriasData, error: catErr } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('tipo', 'receita')
        .eq('nome', 'Mensalidades')
        .limit(1);

      if (catErr) throw catErr;

      setCategoriaMensalidades(categoriasData?.[0] || null);
      setIdosos(idososData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de receitas futuras');
    } finally {
      setLoading(false);
    }
  };

  const calcularFimDoMes = (inicioMesISO: string) => {
    const d = new Date(inicioMesISO);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const fetchReceitasDoMes = async () => {
    if (!categoriaMensalidades) return;
    try {
      setLoadingReceitas(true);
      const inicioMes = mesReferencia;
      const fimMes = calcularFimDoMes(mesReferencia);
      const { data, error } = await supabase
        .from('contas_receber')
        .select('id, descricao, valor, data_vencimento, status')
        .eq('categoria_id', categoriaMensalidades.id)
        .gte('data_vencimento', inicioMes)
        .lt('data_vencimento', fimMes)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setReceitasMes((data || []) as ContaReceberResumo[]);
    } catch (error) {
      console.error('Erro ao carregar receitas do mês:', error);
      toast.error('Erro ao carregar receitas futuras do mês');
    } finally {
      setLoadingReceitas(false);
    }
  };

  useEffect(() => {
    fetchReceitasDoMes();
  }, [mesReferencia, categoriaMensalidades]);

  const totalContribuicoes = useMemo(() => {
    return idosos.reduce((sum, i) => {
      const valor = i.beneficio_valor || 0;
      const pct = i.contribuicao_percentual ?? 70;
      return sum + (valor * pct / 100);
    }, 0);
  }, [idosos]);

  const handleBeneficioChange = (idosoId: string, field: keyof Idoso, value: any) => {
    setIdosos(prev => prev.map(i => i.id === idosoId ? { ...i, [field]: value } : i));
  };

  const salvarBeneficios = async () => {
    try {
      const updates = idosos.map(i => ({
        id: i.id,
        beneficio_tipo: i.beneficio_tipo || null,
        beneficio_valor: i.beneficio_valor ?? null,
        contribuicao_percentual: i.contribuicao_percentual ?? 70
      }));

      const { error } = await supabase
        .from('idosos')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
      toast.success('Benefícios atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao salvar benefícios:', error);
      toast.error('Erro ao salvar benefícios');
    }
  };

  const gerarMensalidades = async () => {
    try {
      if (!categoriaMensalidades) {
        toast.error('Categoria "Mensalidades" não encontrada');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const vencimento = mesReferencia; // usar primeiro dia do mês

      const inserts = idosos
        .filter(i => (i.beneficio_valor || 0) > 0)
        .map(i => ({
          descricao: `Mensalidade ${i.nome} ${new Date(vencimento).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          valor: Number(((i.beneficio_valor || 0) * (i.contribuicao_percentual ?? 70) / 100).toFixed(2)),
          data_vencimento: vencimento,
          categoria_id: categoriaMensalidades.id,
          idoso_id: i.id,
          pagador_nome: i.nome,
          forma_pagamento: 'dinheiro',
          status: 'pendente',
          created_by: userData.user?.id || '00000000-0000-0000-0000-000000000000'
        }));

      const { error } = await supabase
        .from('contas_receber')
        .insert(inserts);

      if (error) throw error;
      toast.success('Mensalidades geradas com sucesso');
      fetchReceitasDoMes();
    } catch (error) {
      console.error('Erro ao gerar mensalidades:', error);
      toast.error('Erro ao gerar mensalidades');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receitas Futuras</h1>
          <p className="text-muted-foreground">Resumo de contribuições e geração de mensalidades</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contribuições</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatBrazilianCurrency(totalContribuicoes)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mês de Referência</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <DateInput id="mes" label="Mês" value={mesReferencia} onChange={setMesReferencia} />
          </CardContent>
        </Card>
      </div>

      {/* Lista de idosos e edição de benefício */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios dos Idosos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idoso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Benefício</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Benefício</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contribuição (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Mensalidade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {idosos.map((i) => {
                  const valor = i.beneficio_valor || 0;
                  const pct = i.contribuicao_percentual ?? 70;
                  const mensalidade = valor * pct / 100;
                  return (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{i.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select value={i.beneficio_tipo || ''} onValueChange={(v) => handleBeneficioChange(i.id, 'beneficio_tipo', v || null)}>
                          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
                            <SelectItem value="loas">LOAS</SelectItem>
                            <SelectItem value="bpc">BPC</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input type="number" step="0.01" value={i.beneficio_valor ?? ''} onChange={(e) => handleBeneficioChange(i.id, 'beneficio_valor', e.target.value ? Number(e.target.value) : null)} placeholder="0,00" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input type="number" step="0.01" value={i.contribuicao_percentual ?? 70} onChange={(e) => handleBeneficioChange(i.id, 'contribuicao_percentual', e.target.value ? Number(e.target.value) : 70)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-700 font-semibold">{formatBrazilianCurrency(mensalidade)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={salvarBeneficios} className="w-full sm:w-auto">Salvar Benefícios</Button>
            <Button onClick={gerarMensalidades} className="w-full sm:w-auto" variant="secondary">
              <DollarSign className="h-4 w-4 mr-2" />
              Gerar Mensalidades do Mês
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receitas Futuras do Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas Futuras (Mensalidades do Mês)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReceitas ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : receitasMes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma receita gerada para este mês.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receitasMes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{r.descricao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-700 font-semibold">{formatBrazilianCurrency(r.valor)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatBrazilianDate(r.data_vencimento)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {r.status === 'pendente' && (
                          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Pendente</span>
                        )}
                        {r.status === 'recebido' && (
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Recebido</span>
                        )}
                        {r.status === 'vencido' && (
                          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Vencido</span>
                        )}
                        {r.status === 'cancelado' && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Cancelado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Total do mês: {formatBrazilianCurrency(receitasMes.reduce((s, r) => s + (r.valor || 0), 0))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceitasFuturasPage;