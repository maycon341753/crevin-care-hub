import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, User, Download, Receipt } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBrazilianCurrency, formatBrazilianDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateReciboDoacao, generateNumeroRecibo } from "@/components/ReciboDoacao";

interface DoacaoDinheiro {
  id: string;
  doador_nome: string;
  doador_email?: string;
  doador_telefone?: string;
  doador_cpf?: string;
  valor: number;
  data_doacao: string;
  forma_pagamento: string;
  observacoes?: string;
  comprovante_url?: string;
  status: string;
  created_at: string;
}

export default function DoacoesDinheiroPage() {
  const [doacoes, setDoacoes] = useState<DoacaoDinheiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoacao, setEditingDoacao] = useState<DoacaoDinheiro | null>(null);
  const [deletingDoacao, setDeletingDoacao] = useState<DoacaoDinheiro | null>(null);
  const { toast } = useToast();

  const fetchDoacoes = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('doacoes_dinheiro')
        .select('*')
        .order('data_doacao', { ascending: false });

      if (error) throw error;

      setDoacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar doações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as doações em dinheiro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDoacoes();
  }, [fetchDoacoes]);

  const handleGerarRecibo = (doacao: DoacaoDinheiro) => {
    try {
      const numeroRecibo = generateNumeroRecibo();
      
      generateReciboDoacao(doacao, {
        numeroRecibo,
        presidente: '', // Será preenchido manualmente
        setor: '' // Será preenchido manualmente
      });

      toast({
        title: "Recibo gerado com sucesso!",
        description: `Recibo ${numeroRecibo} foi baixado para seu computador.`,
      });
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o recibo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const filteredDoacoes = doacoes.filter(doacao =>
    doacao.doador_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doacao.doador_cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doacao.forma_pagamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors = {
      "confirmada": "bg-success text-success-foreground",
      "pendente": "bg-warning text-warning-foreground",
      "cancelada": "bg-destructive text-destructive-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const getFormaPagamentoBadge = (forma: string) => {
    const colors = {
      "pix": "bg-success text-success-foreground",
      "cartao": "bg-primary text-primary-foreground",
      "dinheiro": "bg-warning text-warning-foreground",
      "transferencia": "bg-info text-info-foreground",
      "cheque": "bg-secondary text-secondary-foreground",
      "boleto": "bg-muted text-muted-foreground",
    };
    return colors[forma as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const totalDoacoes = filteredDoacoes.reduce((acc, doacao) => acc + doacao.valor, 0);
  const totalConfirmadas = filteredDoacoes.filter(d => d.status === 'confirmada').reduce((acc, doacao) => acc + doacao.valor, 0);
  const totalPendentes = filteredDoacoes.filter(d => d.status === 'pendente').reduce((acc, doacao) => acc + doacao.valor, 0);

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Doações em Dinheiro</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie doações em dinheiro recebidas pela CREVIN
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button 
            className="w-full sm:w-auto bg-gradient-secondary hover:bg-secondary-hover"
            onClick={() => setShowAddModal(true)}
          >
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
              Total Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatBrazilianCurrency(totalDoacoes)}
            </div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-success">
              {formatBrazilianCurrency(totalConfirmadas)}
            </div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">
              {formatBrazilianCurrency(totalPendentes)}
            </div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Doações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{filteredDoacoes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="crevin-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <DollarSign className="h-5 w-5 text-success" />
            Registro de Doações em Dinheiro
          </CardTitle>
          <CardDescription>
            Gerencie todas as doações em dinheiro recebidas pela instituição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por doador, CPF ou forma de pagamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Doador</TableHead>
                  <TableHead className="min-w-[120px] hidden sm:table-cell">CPF</TableHead>
                  <TableHead className="min-w-[100px]">Valor</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell">Forma Pagamento</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Data</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchTerm ? "Nenhuma doação encontrada com os filtros aplicados." : "Nenhuma doação em dinheiro cadastrada."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDoacoes.map((doacao) => (
                    <TableRow key={doacao.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{doacao.doador_nome}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {doacao.doador_cpf}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{doacao.doador_cpf}</TableCell>
                      <TableCell className="font-semibold text-success text-sm">
                        {formatBrazilianCurrency(doacao.valor)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={getFormaPagamentoBadge(doacao.forma_pagamento)}>
                          {doacao.forma_pagamento.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {formatBrazilianDate(doacao.data_doacao)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(doacao.status)}>
                          {doacao.status.charAt(0).toUpperCase() + doacao.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => setEditingDoacao(doacao)}
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleGerarRecibo(doacao)}
                          >
                            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Recibo</span>
                          </Button>
                        </div>
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