import { useEffect, useMemo, useState } from "react";
import { Package, Search, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBrazilianDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateGuiaDoacaoItens } from "@/components/GuiaDoacaoItens";

type DoacaoItem = {
  id: string;
  protocolo?: string;
  doador_nome: string;
  doador_cpf: string;
  item_nome: string;
  quantidade: string; // tabela usa TEXT (ex: "2kg", "50 unidades")
  data_doacao: string;
};

export default function DoacoesItensPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [doacoesItens, setDoacoesItens] = useState<DoacaoItem[]>([]);

  useEffect(() => {
    const fetchItens = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("doacoes_itens")
        .select("*")
        .order("data_doacao", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setDoacoesItens((data ?? []) as DoacaoItem[]);
      setLoading(false);
    };

    fetchItens();
  }, []);

  const filteredItens = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return doacoesItens;
    return doacoesItens.filter((d) => {
      return (
        d.doador_nome.toLowerCase().includes(term) ||
        d.doador_cpf.toLowerCase().includes(term) ||
        d.item_nome.toLowerCase().includes(term) ||
        d.protocolo.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, doacoesItens]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Doações de Itens</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por doador, protocolo ou item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2" />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Protocolo</TableHead>
                  <TableHead className="min-w-[150px]">Doador</TableHead>
                  <TableHead className="min-w-[120px] hidden sm:table-cell">CPF</TableHead>
                  <TableHead className="min-w-[120px]">Item</TableHead>
                  <TableHead className="min-w-[80px] hidden md:table-cell">Quantidade</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Data</TableHead>
                  <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Carregando doações de itens...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-destructive">
                      Erro ao carregar: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredItens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma doação de itens cadastrada.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItens.map((doacao) => (
                    <TableRow key={doacao.id}>
                      <TableCell className="font-mono text-xs sm:text-sm">{doacao.protocolo ?? "—"}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{doacao.doador_nome}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{doacao.doador_cpf}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{doacao.doador_cpf}</TableCell>
                      <TableCell>
                        <div className="text-sm">{doacao.item_nome}</div>
                        <div className="text-xs text-secondary font-semibold md:hidden">Qtd: {doacao.quantidade}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-semibold text-secondary">
                        {doacao.quantidade}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {formatBrazilianDate(doacao.data_doacao)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="text-xs rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow-sm hover:shadow-md hover:from-primary/90 hover:to-purple-600/90 transition-all px-3 sm:px-4"
                          onClick={() => handleGerarGuia(doacao)}
                        >
                          <Receipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 opacity-90" />
                          <span className="hidden sm:inline font-medium">Guia</span>
                        </Button>
                      </TableCell>
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
      // opcional: toast via sonner aqui, se quiser feedback
    } catch (err) {
      console.error('Erro ao gerar guia:', err);
    }
  };