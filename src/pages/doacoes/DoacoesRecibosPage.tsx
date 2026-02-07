import { useEffect, useMemo, useState, useCallback } from "react";
import { Receipt, Package, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBrazilianCurrency, formatBrazilianDate } from "@/lib/utils";
import { toast } from "sonner";
import { generateReciboDoacao, generateNumeroRecibo } from "@/components/ReciboDoacao";
import { generateGuiaDoacaoItens } from "@/components/GuiaDoacaoItens";

type DoacaoDinheiro = {
  id: string;
  protocolo: string;
  doador_nome: string;
  doador_cpf: string;
  valor: number;
  tipo_pagamento: string;
  data_doacao: string;
  recibo_gerado: boolean;
};

type DoacaoItem = {
  id: string;
  protocolo?: string;
  doador_nome: string;
  doador_cpf: string;
  item_nome: string;
  quantidade: string;
  data_doacao: string;
  guia_gerada?: boolean;
};

export default function DoacoesRecibosPage() {
  const [tab, setTab] = useState<'dinheiro' | 'itens'>('dinheiro');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dinheiro, setDinheiro] = useState<DoacaoDinheiro[]>([]);
  const [itens, setItens] = useState<DoacaoItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dinheiroRes, itensRes] = await Promise.all([
        supabase.from('doacoes_dinheiro').select('*').order('data_doacao', { ascending: false }),
        supabase.from('doacoes_itens').select('*').order('data_doacao', { ascending: false }),
      ]);

      if (dinheiroRes.error) throw dinheiroRes.error;
      if (itensRes.error) throw itensRes.error;

      setDinheiro(dinheiroRes.data || []);
      setItens(itensRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar recibos/guia:', err);
      toast.error('Erro ao carregar recibos/guia');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDinheiro = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return dinheiro;
    return dinheiro.filter(d =>
      d.doador_nome.toLowerCase().includes(term) ||
      d.doador_cpf.toLowerCase().includes(term) ||
      d.protocolo.toLowerCase().includes(term)
    );
  }, [search, dinheiro]);

  const filteredItens = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return itens;
    return itens.filter(d =>
      d.doador_nome.toLowerCase().includes(term) ||
      d.doador_cpf.toLowerCase().includes(term) ||
      (d.protocolo || '').toLowerCase().includes(term) ||
      d.item_nome.toLowerCase().includes(term)
    );
  }, [search, itens]);

  const handleGerarRecibo = async (doacao: DoacaoDinheiro) => {
    try {
      const numeroRecibo = generateNumeroRecibo();
      generateReciboDoacao({
        doador_nome: doacao.doador_nome,
        doador_cpf: doacao.doador_cpf,
        valor: doacao.valor,
        data_doacao: doacao.data_doacao,
        forma_pagamento: doacao.tipo_pagamento,
      }, { numeroRecibo });

      const { error } = await supabase
        .from('doacoes_dinheiro')
        .update({ recibo_gerado: true })
        .eq('id', doacao.id);

      if (error) {
        // Se a coluna não existir no schema cache (migracão ainda não aplicada), não quebrar o fluxo
        if (error.code === 'PGRST204' && (error.message || '').includes("recibo_gerado")) {
          console.warn('Coluna recibo_gerado ausente em doacoes_dinheiro. Recibo gerado, mas status não marcado.', error);
          toast.warning(
            'Recibo gerado, porém a coluna "recibo_gerado" não existe na tabela doações. '
            + 'Para corrigir, aplique a migração ou adicione a coluna no banco.'
          );
        } else {
          throw error;
        }
      } else {
        toast.success(`Recibo ${numeroRecibo} gerado e marcado no sistema`);
      }
      fetchData();
    } catch (err) {
      console.error('Erro ao gerar recibo:', err);
      toast.error('Erro ao gerar recibo');
    }
  };

  const handleGerarGuia = async (doacao: DoacaoItem) => {
    try {
      generateGuiaDoacaoItens({
        doador_nome: doacao.doador_nome,
        doador_cpf: doacao.doador_cpf,
        item_nome: doacao.item_nome,
        quantidade: doacao.quantidade,
        protocolo: doacao.protocolo,
        data_doacao: doacao.data_doacao,
      });
      const { error } = await supabase
        .from('doacoes_itens')
        .update({ guia_gerada: true })
        .eq('id', doacao.id);

      if (error) throw error;
      toast.success('Guia gerada e marcada no sistema');
      fetchData();
    } catch (err) {
      console.error('Erro ao gerar guia:', err);
      toast.error('Erro ao gerar guia');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recibos de Doações</h1>
          <p className="text-muted-foreground">Gerencie recibos de doações em dinheiro e guias de itens</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tab === 'dinheiro' ? 'default' : 'outline'}
            className={tab === 'dinheiro' ? 'rounded-full bg-gradient-to-r from-primary to-purple-600 text-white' : 'rounded-full'}
            onClick={() => setTab('dinheiro')}
          >
            <Receipt className="h-4 w-4 mr-2" /> Dinheiro
          </Button>
          <Button
            variant={tab === 'itens' ? 'default' : 'outline'}
            className={tab === 'itens' ? 'rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white' : 'rounded-full'}
            onClick={() => setTab('itens')}
          >
            <Package className="h-4 w-4 mr-2" /> Itens
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {tab === 'dinheiro' ? <Receipt className="h-5 w-5" /> : <Package className="h-5 w-5" />}
              {tab === 'dinheiro' ? 'Recibos de Doações em Dinheiro' : 'Guias de Doações de Itens'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tab === 'dinheiro' ? "Buscar por nome, CPF ou protocolo" : "Buscar por nome, CPF, item ou protocolo"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Protocolo</TableHead>
                  <TableHead>Doador</TableHead>
                  <TableHead className="hidden sm:table-cell">CPF</TableHead>
                  {tab === 'dinheiro' ? (
                    <>
                      <TableHead className="hidden md:table-cell">Valor</TableHead>
                      <TableHead className="hidden sm:table-cell">Data</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Item</TableHead>
                      <TableHead className="hidden md:table-cell">Quantidade</TableHead>
                      <TableHead className="hidden sm:table-cell">Data</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : (tab === 'dinheiro' ? filteredDinheiro : filteredItens).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  (tab === 'dinheiro' ? filteredDinheiro : filteredItens).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="hidden md:table-cell font-mono text-xs sm:text-sm">{('protocolo' in d ? d.protocolo : '') || '—'}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{d.doador_nome}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{d.doador_cpf}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{d.doador_cpf}</TableCell>
                      {tab === 'dinheiro' ? (
                        <>
                          <TableCell className="hidden md:table-cell font-semibold text-secondary">{formatBrazilianCurrency((d as DoacaoDinheiro).valor)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{formatBrazilianDate((d as DoacaoDinheiro).data_doacao)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{(d as DoacaoDinheiro).recibo_gerado ? 'Recibo gerado' : 'Pendente'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="text-xs rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow-sm hover:shadow-md hover:from-primary/90 hover:to-purple-600/90 transition-all px-3 sm:px-4"
                              onClick={() => handleGerarRecibo(d as DoacaoDinheiro)}
                            >
                              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 opacity-90" />
                              <span className="hidden sm:inline font-medium">Recibo</span>
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <div className="text-sm">{(d as DoacaoItem).item_nome}</div>
                            <div className="text-xs text-secondary font-semibold md:hidden">Qtd: {(d as DoacaoItem).quantidade}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-semibold text-secondary">{(d as DoacaoItem).quantidade}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{formatBrazilianDate((d as DoacaoItem).data_doacao)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{(d as DoacaoItem).guia_gerada ? 'Guia gerada' : 'Pendente'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="text-xs rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow-sm hover:shadow-md hover:from-primary/90 hover:to-pink-600/90 transition-all px-3 sm:px-4"
                              onClick={() => handleGerarGuia(d as DoacaoItem)}
                            >
                              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 opacity-90" />
                              <span className="hidden sm:inline font-medium">Guia</span>
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}