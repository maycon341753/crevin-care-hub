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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Doações</h1>
          <p className="text-muted-foreground">
            Gerencie doações em dinheiro e itens recebidos pela CREVIN
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button className="bg-gradient-secondary hover:bg-secondary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Nova Doação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Dinheiro (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
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
            <div className="text-2xl font-bold text-secondary">{totalDoacoesItens}</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doadores Únicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recibos Gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different types of donations */}
      <Card className="crevin-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
              <TabsTrigger value="dinheiro" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Doações em Dinheiro
              </TabsTrigger>
              <TabsTrigger value="itens" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Doações de Itens
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Doador</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doacoesDinheiro.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma doação em dinheiro cadastrada.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      doacoesDinheiro.map((doacao) => (
                      <TableRow key={doacao.id}>
                        <TableCell className="font-mono">{doacao.protocolo}</TableCell>
                        <TableCell className="font-medium">{doacao.doador_nome}</TableCell>
                        <TableCell>{doacao.doador_cpf}</TableCell>
                        <TableCell className="font-semibold text-success">
                          R$ {doacao.valor?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoBadge(doacao.tipo_pagamento)}>
                            {doacao.tipo_pagamento}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(doacao.data_doacao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Receipt className="h-4 w-4 mr-2" />
                            Recibo
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Doador</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doacoesItens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma doação de itens cadastrada.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      doacoesItens.map((doacao) => (
                      <TableRow key={doacao.id}>
                        <TableCell className="font-mono">{doacao.protocolo}</TableCell>
                        <TableCell className="font-medium">{doacao.doador_nome}</TableCell>
                        <TableCell>{doacao.doador_cpf}</TableCell>
                        <TableCell>{doacao.item_nome}</TableCell>
                        <TableCell className="font-semibold text-secondary">
                          {doacao.quantidade}
                        </TableCell>
                        <TableCell>
                          {new Date(doacao.data_doacao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Receipt className="h-4 w-4 mr-2" />
                            Guia
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