import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, User, Download, Receipt } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBrazilianCurrency, formatBrazilianDate, formatCurrencyInput, parseBrazilianCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateReciboDoacao, generateNumeroRecibo } from "@/components/ReciboDoacao";
import jsPDF from "jspdf";

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
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    doador_nome: "",
    doador_cpf: "",
    doador_email: "",
    doador_telefone: "",
    valor: "",
    forma_pagamento: "dinheiro",
    data_doacao: new Date().toISOString().slice(0, 10),
    observacoes: "",
  });
  const [editingDoacao, setEditingDoacao] = useState<DoacaoDinheiro | null>(null);
  const [deletingDoacao, setDeletingDoacao] = useState<DoacaoDinheiro | null>(null);
  const { toast } = useToast();
  const [editForm, setEditForm] = useState({
    doador_nome: "",
    doador_cpf: "",
    doador_email: "",
    doador_telefone: "",
    valor: "",
    forma_pagamento: "dinheiro",
    data_doacao: new Date().toISOString().slice(0, 10),
    observacoes: "",
  });

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

  const handleAddInputChange = (field: keyof typeof addForm, value: string) => {
    // Para o campo de valor, aplicamos a máscara e removemos zero à esquerda
    if (field === "valor") {
      const masked = formatCurrencyInput(value);
      // Se a parte inteira tiver mais de 1 dígito e começar com zero, remove o zero inicial
      const fixed = masked.replace(/^0(?=\d+,)/, "");
      setAddForm((prev) => ({ ...prev, valor: fixed }));
      return;
    }

    setAddForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitNovaDoacao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || "00000000-0000-0000-0000-000000000000";

      const payloadBase: any = {
        doador_nome: addForm.doador_nome.trim(),
        doador_cpf: addForm.doador_cpf?.trim() || null,
        doador_email: addForm.doador_email?.trim() || null,
        doador_telefone: addForm.doador_telefone?.trim() || null,
        valor: parseBrazilianCurrency(addForm.valor),
        data_doacao: addForm.data_doacao,
        observacoes: addForm.observacoes?.trim() || null,
        status: "confirmada",
        created_by: userId,
      };

      // Primeiro tenta com forma_pagamento (schema mais recente)
      const payloadForma = { ...payloadBase, forma_pagamento: addForm.forma_pagamento };
      let { error } = await supabase.from("doacoes_dinheiro").insert([payloadForma]);

      // Fallback para tipo_pagamento (schema antigo)
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("forma_pagamento") || msg.includes("column \"forma_pagamento\"")) {
          const mapTipo: Record<string, string> = {
            pix: "PIX",
            pix_eletronico: "PIX Eletrônico",
            mesada_eletronica: "Mesada Eletrônica",
            cartao: "Cartão",
            dinheiro: "Dinheiro",
            transferencia: "Transferência",
            cheque: "Cheque",
            boleto: "Boleto",
          };
          const payloadTipo = { ...payloadBase, tipo_pagamento: mapTipo[addForm.forma_pagamento] || addForm.forma_pagamento };
          const retry = await supabase.from("doacoes_dinheiro").insert([payloadTipo]);
          error = retry.error;
        }
      }

      if (error) throw error;

      toast({
        title: "Doação cadastrada",
        description: "A nova doação foi adicionada com sucesso.",
      });
      setShowAddModal(false);
      setAddForm({
        doador_nome: "",
        doador_cpf: "",
        doador_email: "",
        doador_telefone: "",
        valor: "",
        forma_pagamento: "dinheiro",
        data_doacao: new Date().toISOString().slice(0, 10),
        observacoes: "",
      });
      fetchDoacoes();
    } catch (err: any) {
      console.error("Erro ao adicionar doação:", err);
      toast({
        title: "Erro",
        description: err?.message || "Não foi possível adicionar a doação.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

  useEffect(() => {
    if (editingDoacao) {
      setEditForm({
        doador_nome: editingDoacao.doador_nome || "",
        doador_cpf: editingDoacao.doador_cpf || "",
        doador_email: editingDoacao.doador_email || "",
        doador_telefone: editingDoacao.doador_telefone || "",
        valor: (editingDoacao.valor ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        forma_pagamento: editingDoacao.forma_pagamento || "dinheiro",
        data_doacao: editingDoacao.data_doacao?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        observacoes: editingDoacao.observacoes || "",
      });
    }
  }, [editingDoacao]);

  const handleEditInputChange = (field: keyof typeof editForm, value: string) => {
    if (field === "valor") {
      const masked = formatCurrencyInput(value);
      const fixed = masked.replace(/^0(?=\d+,)/, "");
      setEditForm((prev) => ({ ...prev, valor: fixed }));
      return;
    }
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteDoacao = async (doacao: DoacaoDinheiro) => {
    if (!confirm(`Tem certeza que deseja excluir a doação de ${doacao.doador_nome}?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('doacoes_dinheiro')
        .delete()
        .eq('id', doacao.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Doação excluída com sucesso.",
      });
      fetchDoacoes();
    } catch (error) {
      console.error('Erro ao excluir doação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a doação.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSubmitEditarDoacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoacao) return;
    try {
      setSaving(true);
      const payloadBase: any = {
        doador_nome: editForm.doador_nome.trim(),
        doador_cpf: editForm.doador_cpf?.trim() || null,
        doador_email: editForm.doador_email?.trim() || null,
        doador_telefone: editForm.doador_telefone?.trim() || null,
        valor: parseBrazilianCurrency(editForm.valor),
        data_doacao: editForm.data_doacao,
        observacoes: editForm.observacoes?.trim() || null,
      };

      const payloadForma = { ...payloadBase, forma_pagamento: editForm.forma_pagamento };
      let { error } = await supabase
        .from("doacoes_dinheiro")
        .update(payloadForma)
        .eq("id", editingDoacao.id);

      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("forma_pagamento") || msg.includes("column \"forma_pagamento\"")) {
          const mapTipo: Record<string, string> = {
            pix: "PIX",
            pix_eletronico: "PIX Eletrônico",
            mesada_eletronica: "Mesada Eletrônica",
            cartao: "Cartão",
            dinheiro: "Dinheiro",
            transferencia: "Transferência",
            cheque: "Cheque",
            boleto: "Boleto",
          };
          const payloadTipo = { ...payloadBase, tipo_pagamento: mapTipo[editForm.forma_pagamento] || editForm.forma_pagamento };
          const retry = await supabase
            .from("doacoes_dinheiro")
            .update(payloadTipo)
            .eq("id", editingDoacao.id);
          error = retry.error;
        }
      }

      if (error) throw error;

      toast({
        title: "Doação atualizada",
        description: "As informações da doação foram atualizadas com sucesso.",
      });
      setEditingDoacao(null);
      fetchDoacoes();
    } catch (err: any) {
      console.error("Erro ao atualizar doação:", err);
      toast({
        title: "Erro",
        description: err?.message || "Não foi possível atualizar a doação.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      "pix_eletronico": "bg-success text-success-foreground",
      "mesada_eletronica": "bg-info text-info-foreground",
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

  const exportarRelatorioPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // === CABEÇALHO ===
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(3);
      doc.line(20, 15, pageWidth - 20, 15);

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('RELATORIO DE DOACOES EM DINHEIRO', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      doc.text(`Gerado em: ${dataAtual}`, pageWidth / 2, 38, { align: 'center' });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(20, 45, pageWidth - 20, 45);

      yPosition = 55;

      // === RESUMO ===
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('RESUMO', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Registros: ${filteredDoacoes.length}`, 20, yPosition);
      doc.text(`Valor Total: ${formatBrazilianCurrency(totalDoacoes)}`, pageWidth - 80, yPosition);
      yPosition += 8;
      doc.text(`Confirmadas: ${formatBrazilianCurrency(totalConfirmadas)}`, 20, yPosition);
      doc.text(`Pendentes: ${formatBrazilianCurrency(totalPendentes)}`, pageWidth - 80, yPosition);
      
      yPosition += 15;

      // === TABELA DE DOAÇÕES ===
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('LISTAGEM DE DOACOES', 20, yPosition);
      yPosition += 10;

      // Cabeçalho da Tabela
      doc.setFillColor(59, 130, 246);
      doc.setTextColor(255, 255, 255);
      doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      const col1 = 25;  // Data
      const col2 = 55;  // Doador
      const col3 = 120; // Forma Pagto
      const col4 = 160; // Status
      const col5 = pageWidth - 25; // Valor (align right)

      doc.text('DATA', col1, yPosition + 2);
      doc.text('DOADOR', col2, yPosition + 2);
      doc.text('FORMA PAGTO', col3, yPosition + 2);
      doc.text('STATUS', col4, yPosition + 2);
      doc.text('VALOR', col5, yPosition + 2, { align: 'right' });

      yPosition += 10;

      // Dados
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      filteredDoacoes.forEach((doacao, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');
        }

        const dataFormatada = formatBrazilianDate(doacao.data_doacao);
        const nomeDoador = doacao.doador_nome.length > 25 ? doacao.doador_nome.substring(0, 25) + '...' : doacao.doador_nome;
        const formaPagto = doacao.forma_pagamento.charAt(0).toUpperCase() + doacao.forma_pagamento.slice(1).replace('_', ' ');
        const status = doacao.status.charAt(0).toUpperCase() + doacao.status.slice(1);

        doc.text(dataFormatada, col1, yPosition);
        doc.text(nomeDoador, col2, yPosition);
        doc.text(formaPagto, col3, yPosition);
        doc.text(status, col4, yPosition);
        doc.text(formatBrazilianCurrency(doacao.valor), col5, yPosition, { align: 'right' });

        yPosition += 8;

        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 30;
        }
      });

      doc.save(`relatorio-doacoes-dinheiro-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
    }
  };

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
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={exportarRelatorioPDF}>
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
                  <TableHead className="text-right min-w-[140px]">Ações</TableHead>
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
                            size="sm"
                            className="text-xs rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow-sm hover:shadow-md hover:from-primary/90 hover:to-purple-600/90 transition-all px-3 sm:px-4"
                            onClick={() => handleGerarRecibo(doacao)}
                          >
                            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 opacity-90" />
                            <span className="hidden sm:inline font-medium">Recibo</span>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleDeleteDoacao(doacao)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Excluir</span>
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

      {/* Modal: Nova Doação */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Doação em Dinheiro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitNovaDoacao} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Doador</Label>
                <Input
                  value={addForm.doador_nome}
                  onChange={(e) => handleAddInputChange("doador_nome", e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={addForm.doador_cpf}
                  onChange={(e) => handleAddInputChange("doador_cpf", e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={addForm.doador_email}
                  onChange={(e) => handleAddInputChange("doador_email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={addForm.doador_telefone}
                  onChange={(e) => handleAddInputChange("doador_telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  value={addForm.valor}
                  onChange={(e) => handleAddInputChange("valor", e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select
                  value={addForm.forma_pagamento}
                  onValueChange={(v) => handleAddInputChange("forma_pagamento", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="pix_eletronico">PIX Eletrônico</SelectItem>
                    <SelectItem value="mesada_eletronica">Mesada Eletrônica</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data da Doação</Label>
                <Input
                  type="date"
                  value={addForm.data_doacao}
                  onChange={(e) => handleAddInputChange("data_doacao", e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={addForm.observacoes}
                  onChange={(e) => handleAddInputChange("observacoes", e.target.value)}
                  placeholder="Notas adicionais"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Doação */}
      <Dialog open={!!editingDoacao} onOpenChange={(open) => !open && setEditingDoacao(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Doação em Dinheiro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEditarDoacao} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Doador</Label>
                <Input
                  value={editForm.doador_nome}
                  onChange={(e) => handleEditInputChange("doador_nome", e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={editForm.doador_cpf}
                  onChange={(e) => handleEditInputChange("doador_cpf", e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={editForm.doador_email}
                  onChange={(e) => handleEditInputChange("doador_email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editForm.doador_telefone}
                  onChange={(e) => handleEditInputChange("doador_telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  value={editForm.valor}
                  onChange={(e) => handleEditInputChange("valor", e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select
                  value={editForm.forma_pagamento}
                  onValueChange={(v) => handleEditInputChange("forma_pagamento", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="pix_eletronico">PIX Eletrônico</SelectItem>
                    <SelectItem value="mesada_eletronica">Mesada Eletrônica</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data da Doação</Label>
                <Input
                  type="date"
                  value={editForm.data_doacao}
                  onChange={(e) => handleEditInputChange("data_doacao", e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={editForm.observacoes}
                  onChange={(e) => handleEditInputChange("observacoes", e.target.value)}
                  placeholder="Notas adicionais"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingDoacao(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
