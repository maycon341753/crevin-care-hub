import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Download, Receipt, HandHeart, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function DoacoesPage() {
  const [doacoesDinheiro, setDoacoesDinheiro] = useState<any[]>([]);
  const [doacoesItens, setDoacoesItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchDoacoes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar doações em dinheiro
      const { data: dinheiroData, error: dinheiroError } = await supabase
        .from('doacoes_dinheiro')
        .select('*')
        .order('data_doacao', { ascending: false });

      if (dinheiroError) throw dinheiroError;

      // Buscar doações de itens
      const { data: itensData, error: itensError } = await supabase
        .from('doacoes_itens')
        .select('*')
        .order('data_doacao', { ascending: false });

      if (itensError) throw itensError;

      setDoacoesDinheiro(dinheiroData || []);
      setDoacoesItens(itensData || []);
    } catch (error) {
      console.error('Erro ao carregar doações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as doações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDoacoes();
  }, [fetchDoacoes]);
  
  const getTipoBadge = (tipo: string) => {
    const colors = {
      "PIX": "bg-success text-success-foreground",
      "Cartão": "bg-primary text-primary-foreground",
      "Dinheiro": "bg-warning text-warning-foreground",
    };
    return colors[tipo as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const totalDoacoesDinheiro = doacoesDinheiro.reduce((acc, doacao) => acc + doacao.valor, 0);
  const totalDoacoesItens = doacoesItens.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Doações</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie doações em dinheiro e itens recebidos pela CREVIN
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button className="w-full sm:w-auto bg-gradient-secondary hover:bg-secondary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Nova Doação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Dinheiro (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-success">
              R$ {totalDoacoesDinheiro.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doações de Itens (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-secondary">{totalDoacoesItens}</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doadores Únicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">127</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recibos Gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">89</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different types of donations */}
      <Card className="crevin-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <HandHeart className="h-5 w-5 text-secondary" />
            Registro de Doações
          </CardTitle>
          <CardDescription>
            Gerencie doações em dinheiro e itens recebidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dinheiro" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dinheiro" className="flex items-center gap-2 text-xs sm:text-sm">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Doações em</span> Dinheiro
              </TabsTrigger>
              <TabsTrigger value="itens" className="flex items-center gap-2 text-xs sm:text-sm">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Doações de</span> Itens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dinheiro" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por doador ou protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Protocolo</TableHead>
                      <TableHead className="min-w-[150px]">Doador</TableHead>
                      <TableHead className="min-w-[120px] hidden sm:table-cell">CPF</TableHead>
                      <TableHead className="min-w-[100px]">Valor</TableHead>
                      <TableHead className="min-w-[80px] hidden md:table-cell">Tipo</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">Data</TableHead>
                      <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doacoesDinheiro.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma doação em dinheiro cadastrada.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      doacoesDinheiro.map((doacao) => (
                      <TableRow key={doacao.id}>
                        <TableCell className="font-mono text-xs sm:text-sm">{doacao.protocolo}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{doacao.doador_nome}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {doacao.doador_cpf}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{doacao.doador_cpf}</TableCell>
                        <TableCell className="font-semibold text-success text-sm">
                          R$ {doacao.valor?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className={getTipoBadge(doacao.tipo_pagamento)}>
                            {doacao.tipo_pagamento}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {new Date(doacao.data_doacao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="text-xs">
                            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Recibo</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="itens" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por doador ou protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                    {doacoesItens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma doação de itens cadastrada.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      doacoesItens.map((doacao) => (
                      <TableRow key={doacao.id}>
                        <TableCell className="font-mono text-xs sm:text-sm">{doacao.protocolo}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{doacao.doador_nome}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {doacao.doador_cpf}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{doacao.doador_cpf}</TableCell>
                        <TableCell>
                          <div className="text-sm">{doacao.item_nome}</div>
                          <div className="text-xs text-secondary font-semibold md:hidden">
                            Qtd: {doacao.quantidade}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-semibold text-secondary">
                          {doacao.quantidade}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {new Date(doacao.data_doacao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="text-xs">
                            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Guia</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}