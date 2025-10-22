import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import { toast } from "sonner";
import { FileText, Download, Calendar, DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBrazilianCurrency, formatBrazilianDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

interface RelatorioData {
  totalDoacoesDinheiro: number;
  totalDoacoesItens: number;
  totalDespesas: number;
  saldoLiquido: number;
  doacoesPorMes: any[];
  despesasPorMes: any[];
  maioresDoadores: any[];
}

export default function DoacoesRelatoriosPage() {
  const [relatorioData, setRelatorioData] = useState<RelatorioData>({
    totalDoacoesDinheiro: 0,
    totalDoacoesItens: 0,
    totalDespesas: 0,
    saldoLiquido: 0,
    doacoesPorMes: [],
    despesasPorMes: [],
    maioresDoadores: []
  });
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipoRelatorio, setTipoRelatorio] = useState("geral");
  const { toast } = useToast();

  const fetchRelatorioData = useCallback(async () => {
    try {
      setLoading(true);
      
      let startDate = dataInicio;
      let endDate = dataFim;

      // Buscar doações em dinheiro
      let dinheiroQuery = supabase
        .from('doacoes_dinheiro')
        .select('*');
      
      if (startDate && endDate) {
        dinheiroQuery = dinheiroQuery
          .gte('data_doacao', startDate)
          .lte('data_doacao', endDate);
      }

      const { data: dinheiroData, error: dinheiroError } = await dinheiroQuery;
      if (dinheiroError) throw dinheiroError;

      // Buscar doações de itens
      let itensQuery = supabase
        .from('doacoes_itens')
        .select('*');
      
      if (startDate && endDate) {
        itensQuery = itensQuery
          .gte('data_doacao', startDate)
          .lte('data_doacao', endDate);
      }

      const { data: itensData, error: itensError } = await itensQuery;
      if (itensError) throw itensError;

      // Buscar contas a pagar (despesas)
      let despesasQuery = supabase
        .from('contas_pagar')
        .select('*');
      
      if (startDate && endDate) {
        despesasQuery = despesasQuery
          .gte('data_vencimento', startDate)
          .lte('data_vencimento', endDate);
      }

      const { data: despesasData, error: despesasError } = await despesasQuery;
      if (despesasError) throw despesasError;

      // Calcular totais
      const totalDoacoesDinheiro = dinheiroData?.reduce((sum, doacao) => sum + (doacao.valor || 0), 0) || 0;
      const totalDoacoesItens = itensData?.length || 0;
      const totalDespesas = despesasData?.reduce((sum, despesa) => sum + (despesa.valor || 0), 0) || 0;
      const saldoLiquido = totalDoacoesDinheiro - totalDespesas;

      // Agrupar doações por mês
      const doacoesPorMes = dinheiroData?.reduce((acc: any, doacao) => {
        const mes = new Date(doacao.data_doacao).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long' 
        });
        acc[mes] = (acc[mes] || 0) + doacao.valor;
        return acc;
      }, {}) || {};

      // Agrupar despesas por mês
      const despesasPorMes = despesasData?.reduce((acc: any, despesa) => {
        const mes = new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long' 
        });
        acc[mes] = (acc[mes] || 0) + despesa.valor;
        return acc;
      }, {}) || {};

      // Maiores doadores
      const doadoresMap = dinheiroData?.reduce((acc: any, doacao) => {
        const doador = doacao.doador_nome || 'Anônimo';
        acc[doador] = (acc[doador] || 0) + doacao.valor;
        return acc;
      }, {}) || {};

      const maioresDoadores = Object.entries(doadoresMap)
        .map(([nome, valor]) => ({ nome, valor: valor as number }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

      setRelatorioData({
        totalDoacoesDinheiro,
        totalDoacoesItens,
        totalDespesas,
        saldoLiquido,
        doacoesPorMes: Object.entries(doacoesPorMes).map(([mes, valor]) => ({ mes, valor })),
        despesasPorMes: Object.entries(despesasPorMes).map(([mes, valor]) => ({ mes, valor })),
        maioresDoadores
      });

    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, toast]);

  useEffect(() => {
    fetchRelatorioData();
  }, [fetchRelatorioData]);

  // Função para exportar relatório em PDF
  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;
      
      // === CABEÇALHO PROFISSIONAL ===
      // Linha superior decorativa
      doc.setDrawColor(59, 130, 246); // Azul
      doc.setLineWidth(3);
      doc.line(20, 15, pageWidth - 20, 15);
      
      // Título principal
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('RELATORIO DE DOACOES', pageWidth / 2, 30, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Crevin Care Hub - Sistema de Gestao', pageWidth / 2, 40, { align: 'center' });
      
      // Linha inferior do cabeçalho
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(20, 45, pageWidth - 20, 45);
      
      yPosition = 60;
      
      // === INFORMAÇÕES DO RELATÓRIO ===
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.text(`Data de Geracao: ${dataAtual}`, 20, yPosition);
      yPosition += 8;
      
      if (dataInicio && dataFim) {
        doc.text(`Periodo Analisado: ${dataInicio} ate ${dataFim}`, 20, yPosition);
      } else {
        doc.text('Periodo Analisado: Todos os registros', 20, yPosition);
      }
      yPosition += 20;
      
      // === RESUMO EXECUTIVO ===
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('RESUMO EXECUTIVO', 20, yPosition);
      yPosition += 15;
      
      // Caixa do resumo
      doc.setDrawColor(59, 130, 246);
      doc.setFillColor(245, 248, 255);
      doc.roundedRect(20, yPosition - 5, pageWidth - 40, 50, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      yPosition += 8;
      doc.text(`Total Arrecadado (Dinheiro): ${formatBrazilianCurrency(relatorioData.totalDoacoesDinheiro)}`, 25, yPosition);
      yPosition += 10;
      doc.text(`Total de Doacoes (Itens): ${relatorioData.totalDoacoesItens} unidades`, 25, yPosition);
      yPosition += 10;
      doc.text(`Total de Despesas: ${formatBrazilianCurrency(relatorioData.totalDespesas)}`, 25, yPosition);
      yPosition += 10;
      
      // Saldo líquido com destaque
      const saldoPositivo = relatorioData.saldoLiquido >= 0;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(saldoPositivo ? 34 : 239, saldoPositivo ? 197 : 68, saldoPositivo ? 94 : 68);
      doc.text(`Saldo Liquido: ${formatBrazilianCurrency(relatorioData.saldoLiquido)} ${saldoPositivo ? '(POSITIVO)' : '(NEGATIVO)'}`, 25, yPosition);
      
      yPosition += 25;
      
      // === EVOLUÇÃO MENSAL ===
      if (relatorioData.doacoesPorMes.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('EVOLUCAO MENSAL DAS DOACOES', 20, yPosition);
        yPosition += 15;
        
        // Cabeçalho da tabela
        doc.setFillColor(59, 130, 246);
        doc.setTextColor(255, 255, 255);
        doc.rect(20, yPosition - 5, pageWidth - 40, 12, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('MES/ANO', 25, yPosition + 3);
        doc.text('VALOR ARRECADADO', pageWidth - 80, yPosition + 3);
        
        yPosition += 15;
        
        // Dados da tabela
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        relatorioData.doacoesPorMes.forEach((item, index) => {
          // Alternar cores das linhas
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
          }
          
          doc.text(item.mes, 25, yPosition);
          doc.text(formatBrazilianCurrency(item.valor), pageWidth - 80, yPosition);
          yPosition += 10;
          
          // Verificar se precisa de nova página
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 30;
          }
        });
        
        yPosition += 10;
      }
      
      // === RANKING DOS MAIORES DOADORES ===
      if (relatorioData.maioresDoadores.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('TOP 10 - MAIORES DOADORES', 20, yPosition);
        yPosition += 15;
        
        // Cabeçalho da tabela
        doc.setFillColor(34, 197, 94);
        doc.setTextColor(255, 255, 255);
        doc.rect(20, yPosition - 5, pageWidth - 40, 12, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('POSICAO', 25, yPosition + 3);
        doc.text('NOME DO DOADOR', 60, yPosition + 3);
        doc.text('VALOR TOTAL', pageWidth - 60, yPosition + 3);
        
        yPosition += 15;
        
        // Dados dos doadores
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        relatorioData.maioresDoadores.slice(0, 10).forEach((doador, index) => {
          // Alternar cores das linhas
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
          }
          
          // Posições para os 3 primeiros
          let posicao = `${index + 1}o`;
          if (index === 0) posicao = '1o LUGAR';
          else if (index === 1) posicao = '2o LUGAR';
          else if (index === 2) posicao = '3o LUGAR';
          
          doc.text(posicao, 25, yPosition);
          doc.text(doador.nome, 60, yPosition);
          doc.text(formatBrazilianCurrency(doador.valor), pageWidth - 60, yPosition);
          yPosition += 10;
        });
        
        yPosition += 15;
      }
      
      // === ESTATÍSTICAS ADICIONAIS ===
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('ESTATISTICAS COMPLEMENTARES', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const totalDoadores = relatorioData.maioresDoadores.length;
      const mediaDoacao = totalDoadores > 0 ? relatorioData.totalDoacoesDinheiro / totalDoadores : 0;
      
      doc.text(`Total de Doadores Unicos: ${totalDoadores}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Valor Medio por Doador: ${formatBrazilianCurrency(mediaDoacao)}`, 20, yPosition);
      yPosition += 10;
      
      if (relatorioData.maioresDoadores.length > 0) {
        const maiorDoacao = Math.max(...relatorioData.maioresDoadores.map(d => d.valor));
        doc.text(`Maior Doacao Individual: ${formatBrazilianCurrency(maiorDoacao)}`, 20, yPosition);
        yPosition += 10;
      }
      
      // === RODAPÉ ===
      const rodapeY = pageHeight - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, rodapeY - 5, pageWidth - 20, rodapeY - 5);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Crevin Care Hub - Sistema de Gestao de Doacoes', 20, rodapeY);
      doc.text(`Pagina 1 de 1 - Gerado em ${dataAtual}`, pageWidth - 20, rodapeY, { align: 'right' });
      
      // Salvar o PDF
      const nomeArquivo = `relatorio-doacoes-detalhado-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      
      toast({
        title: "PDF exportado com sucesso!",
        description: "Relatório detalhado foi baixado para seu computador.",
      });
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Ocorreu um erro ao gerar o relatório em PDF.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Doações</h1>
          <p className="text-muted-foreground">
            Análise detalhada das doações e despesas da instituição
          </p>
        </div>
        <Button onClick={exportarPDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <DateInput
              label="Data Início"
              value={dataInicio}
              onChange={setDataInicio}
              placeholder="dd/mm/aaaa"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <DateInput
              label="Data Fim"
              value={dataFim}
              onChange={setDataFim}
              placeholder="dd/mm/aaaa"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
            <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Relatório Geral</SelectItem>
                <SelectItem value="doacoes">Apenas Doações</SelectItem>
                <SelectItem value="despesas">Apenas Despesas</SelectItem>
                <SelectItem value="comparativo">Comparativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={fetchRelatorioData} variant="outline">
              Atualizar Relatório
            </Button>
            <Button onClick={exportarPDF} variant="default" className="bg-red-600 hover:bg-red-700">
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doações (R$)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBrazilianCurrency(relatorioData.totalDoacoesDinheiro)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doações de Itens</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {relatorioData.totalDoacoesItens}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatBrazilianCurrency(relatorioData.totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${relatorioData.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatBrazilianCurrency(relatorioData.saldoLiquido)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Doações por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Doações por Mês</CardTitle>
            <CardDescription>Evolução das doações ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorioData.doacoesPorMes.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.mes}</span>
                  <span className="text-sm text-green-600 font-semibold">
                    {formatBrazilianCurrency(item.valor)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Despesas por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Mês</CardTitle>
            <CardDescription>Evolução das despesas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorioData.despesasPorMes.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.mes}</span>
                  <span className="text-sm text-red-600 font-semibold">
                    {formatBrazilianCurrency(item.valor)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maiores Doadores */}
      <Card>
        <CardHeader>
          <CardTitle>Maiores Doadores</CardTitle>
          <CardDescription>Top 10 doadores por valor total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Nome do Doador</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatorioData.maioresDoadores.map((doador, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>{doador.nome}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatBrazilianCurrency(doador.valor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}