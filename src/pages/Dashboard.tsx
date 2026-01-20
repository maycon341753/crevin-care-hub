import { useState, useEffect } from "react";
import { 
  Users, 
  Heart, 
  DollarSign, 
  HandHeart, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  AlertCircle,
  FileText,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatBrazilianCurrency, formatBrazilianDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Dados serão carregados do banco de dados

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    funcionariosAtivos: 0,
    idososAssistidos: 0,
    receitaMensal: 0,
    contasPagar: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({
    ocupacaoQuartos: 0,
    metaDoacoes: 0,
    funcionariosPresentes: 0,
  });
  const [showContasModal, setShowContasModal] = useState(false);
  const [contasCriticas, setContasCriticas] = useState<{
    id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Carregar estatísticas básicas
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const [funcionariosRes, idososRes, contasReceberRes, departamentosRes, contasPagarRes] = await Promise.all([
          supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('idosos').select('*', { count: 'exact', head: true }).eq('ativo', true),
          // Buscar contas a receber e filtrar no cliente (evita inconsistências de status)
          supabase.from('contas_receber')
            .select('valor, data_vencimento, status'),
          supabase.from('departamentos').select('*', { count: 'exact', head: true }).eq('ativo', true),
          supabase.from('contas_pagar').select('valor')
        ]);

        // Calcular receitas do mês atual (soma das contas a receber abertas do mês)
        const receitasMesAtual = (contasReceberRes.data || [])
          .filter((c: any) => {
            const d = new Date(c.data_vencimento);
            const isMesAtual = d >= new Date(inicioMes) && d <= new Date(fimMes);
            const isAberta = c.status !== 'pago' && c.status !== 'recebido' && c.status !== 'cancelado';
            return isMesAtual && isAberta;
          })
          .reduce((acc: number, c: any) => acc + Number(c.valor || 0), 0);

        // Calcular total a receber (abertas), independente do mês
        const receitasAbertasTotal = (contasReceberRes.data || [])
          .filter((c: any) => c.status !== 'pago' && c.status !== 'recebido' && c.status !== 'cancelado')
          .reduce((acc: number, c: any) => acc + Number(c.valor || 0), 0);
        // Calcular total de contas a pagar
        const totalContasPagar = contasPagarRes.data?.reduce((acc, c) => acc + c.valor, 0) || 0;

        setStats({
          funcionariosAtivos: funcionariosRes.count || 0,
          idososAssistidos: idososRes.count || 0,
          receitaMensal: receitasAbertasTotal,
          contasPagar: totalContasPagar,
        });

        // Carregar atividades recentes (últimas doações e funcionários cadastrados)
        const [recentDoacoes, recentFuncionarios] = await Promise.all([
          supabase
            .from('doacoes_dinheiro')
            .select('id, doador_nome, valor, created_at')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('funcionarios')
            .select('id, nome, cargo, created_at')
            .order('created_at', { ascending: false })
            .limit(2)
        ]);

        const activities = [
          ...(recentDoacoes.data || []).map(doacao => ({
            id: `doacao-${doacao.id}`,
            title: `Nova doação recebida`,
            description: `${doacao.doador_nome} doou R$ ${doacao.valor.toLocaleString()}`,
            time: formatBrazilianDate(doacao.created_at),
            icon: HandHeart
          })),
          ...(recentFuncionarios.data || []).map(funcionario => ({
            id: `funcionario-${funcionario.id}`,
            title: `Novo funcionário cadastrado`,
            description: `${funcionario.nome} - ${funcionario.cargo}`,
            time: formatBrazilianDate(funcionario.created_at),
            icon: Users
          }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

        setRecentActivity(activities);
        
        // Carregar alertas baseados em dados reais
        const alertsData = [];
        
        // Verificar funcionários inativos recentes
        const { count: funcionariosInativos } = await supabase
          .from('funcionarios')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'inativo')
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (funcionariosInativos && funcionariosInativos > 0) {
          alertsData.push({
            id: 'funcionarios-inativos',
            title: 'Funcionários Inativos',
            description: `${funcionariosInativos} funcionário(s) ficaram inativos esta semana`,
            type: 'warning',
            priority: 'medium'
          });
        }

        // Verificar meta de doações (exemplo: R$ 10.000 por mês)
        const metaDoacao = 10000;
        const percentualMeta = (receitasMesAtual / metaDoacao) * 100;
        
        if (percentualMeta < 50) {
          alertsData.push({
            id: 'meta-doacoes',
            title: 'Meta de Doações',
            description: `Apenas ${percentualMeta.toFixed(1)}% da meta mensal atingida`,
            type: 'warning',
            priority: 'high'
          });
        }

        setAlerts(alertsData);
        
        // Carregar estatísticas rápidas com dados reais
        const totalFuncionarios = funcionariosRes.count || 0;
        const funcionariosPresentes = Math.floor(totalFuncionarios * 0.85); // Simulação: 85% presentes
        const totalIdosos = idososRes.count || 0;
        const ocupacaoQuartos = totalIdosos > 0 ? Math.min((totalIdosos / 50) * 100, 100) : 0; // Assumindo 50 quartos
        const metaDoacoesPercent = Math.min((receitasMesAtual / metaDoacao) * 100, 100);

        setQuickStats({
          ocupacaoQuartos: Math.round(ocupacaoQuartos),
          metaDoacoes: Math.round(metaDoacoesPercent),
          funcionariosPresentes: totalFuncionarios > 0 ? Math.round((funcionariosPresentes / totalFuncionarios) * 100) : 0,
        });

        // Carregar contas vencidas ou pendentes (Top 5)
        const contasCriticasRes = await supabase
          .from('contas_pagar')
          .select('id, descricao, valor, data_vencimento, status')
          .in('status', ['vencido', 'pendente'])
          .order('data_vencimento', { ascending: true })
          .limit(20);

        const contasOrdenadas = (contasCriticasRes.data || [])
          .sort((a: any, b: any) => {
            const aScore = a.status === 'vencido' ? 0 : 1;
            const bScore = b.status === 'vencido' ? 0 : 1;
            if (aScore !== bScore) return aScore - bScore;
            return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
          })
          .slice(0, 5);

        setContasCriticas(contasOrdenadas);

        // Verificar se existem contas atrasadas (vencidas ou pendentes com data passada)
        // Usamos uma nova variável para evitar conflito com 'hoje' já declarado
        const hojeMeiaNoite = new Date();
        hojeMeiaNoite.setHours(0, 0, 0, 0);
        
        const temContaAtrasada = contasOrdenadas.some((c: any) => {
          const isVencido = c.status === 'vencido';
          const dataVencimento = new Date(c.data_vencimento);
          // Adiciona timezone offset para garantir comparação correta da data
          const dataVencimentoAjustada = new Date(dataVencimento.valueOf() + dataVencimento.getTimezoneOffset() * 60000);
          
          return isVencido || (c.status === 'pendente' && dataVencimentoAjustada < hojeMeiaNoite);
        });

        // Verificar se o modal já foi mostrado nesta sessão
        const modalJaMostrado = sessionStorage.getItem('dashboard_contas_modal_shown');

        if (temContaAtrasada && !modalJaMostrado) {
          setShowContasModal(true);
          sessionStorage.setItem('dashboard_contas_modal_shown', 'true');
        }

      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const statsCards = [
    {
      title: "Funcionários Ativos",
      value: stats.funcionariosAtivos.toString(),
      change: "+0",
      trend: "up",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary-light",
    },
    {
      title: "Idosos Assistidos",
      value: stats.idososAssistidos.toString(),
      change: "+0",
      trend: "up", 
      icon: Heart,
      color: "text-secondary",
      bgColor: "bg-secondary-light",
    },
    {
      title: "A Receber (abertas)",
      value: formatBrazilianCurrency(stats.receitaMensal),
      change: "0%",
      trend: "up",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      title: "Contas a Pagar",
      value: formatBrazilianCurrency(stats.contasPagar),
      change: "+0%",
      trend: "up",
      icon: HandHeart,
      color: "text-warning",
      bgColor: "bg-warning-light",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visão geral do sistema administrativo CREVIN
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-success border-success">
            <Activity className="w-3 h-3 mr-1" />
            Sistema Online
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="crevin-card hover:shadow-lg crevin-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-md ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={stat.trend === "up" ? "text-success" : "text-destructive"}>
                  {stat.change}
                </span>
                <span className="hidden sm:inline">do mês anterior</span>
                <span className="sm:hidden">anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="crevin-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Atividades Recentes
              </CardTitle>
              <CardDescription className="text-sm">
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Blocos de atividades recentes removidos conforme solicitação */}
              {/* Lista inline das 5 contas críticas (vencidas/pendentes) neste div */}
              {contasCriticas && contasCriticas.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Contas vencidas/pendentes (top 5)</p>
                  {contasCriticas.slice(0, 5).map((conta) => (
                    <div key={conta.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-accent/50 crevin-transition">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{conta.descricao}</p>
                        <p className="text-xs text-muted-foreground">Venc.: {formatBrazilianDate(conta.data_vencimento)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={conta.status === "vencido" ? "destructive" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {conta.status}
                        </Badge>
                        <span className="text-sm font-medium">{formatBrazilianCurrency(conta.valor ?? 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-md border">
                  <p className="text-sm text-muted-foreground">Nenhuma conta vencida ou pendente.</p>
                </div>
              )}
              <Button 
                variant="default" 
                className="w-full mt-2 text-sm"
                onClick={() => setShowContasModal(true)}
              >
                Ver contas vencidas/pendentes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card className="crevin-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-warning" />
                Lembretes & Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum alerta no momento</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.type === "warning"
                        ? "border-l-warning bg-warning-light"
                        : alert.type === "info"
                        ? "border-l-primary bg-primary-light"
                        : "border-l-success bg-success-light"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground break-words">{alert.description}</p>
                      </div>
                      <Badge
                        variant={
                          alert.priority === "high"
                            ? "destructive"
                            : alert.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs self-start"
                      >
                        {alert.priority === "high" ? "Alto" : alert.priority === "medium" ? "Médio" : "Baixo"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="crevin-card">
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="truncate pr-2">Ocupação de Quartos</span>
                  <span className="font-medium">{quickStats.ocupacaoQuartos}%</span>
                </div>
                <Progress value={quickStats.ocupacaoQuartos} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="truncate pr-2">Meta de Doações</span>
                  <span className="font-medium">{quickStats.metaDoacoes}%</span>
                </div>
                <Progress value={quickStats.metaDoacoes} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="truncate pr-2">Funcionários Presentes</span>
                  <span className="font-medium">{quickStats.funcionariosPresentes}%</span>
                </div>
                <Progress value={quickStats.funcionariosPresentes} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Modal de contas vencidas/pendentes (Top 5) */}
      <Dialog open={showContasModal} onOpenChange={setShowContasModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contas vencidas ou pendentes (Top 5)</DialogTitle>
          </DialogHeader>
          {contasCriticas.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              Nenhuma conta vencida ou pendente encontrada.
            </div>
          ) : (
            <div className="space-y-3">
              {contasCriticas.map((conta) => (
                <div
                  key={conta.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    conta.status === 'vencido' ? 'bg-destructive/10' : 'bg-warning-light'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium break-words">{conta.descricao}</p>
                    <p className="text-xs text-muted-foreground">Vencimento: {formatBrazilianDate(conta.data_vencimento)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${conta.status === 'vencido' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {formatBrazilianCurrency(conta.valor)}
                    </p>
                    <Badge variant={conta.status === 'vencido' ? 'destructive' : 'secondary'} className="text-xs">
                      {conta.status === 'vencido' ? 'Vencido' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}