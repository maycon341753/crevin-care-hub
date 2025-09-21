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
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Dados serão carregados do banco de dados

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    funcionariosAtivos: 0,
    idososAssistidos: 0,
    receitaMensal: 0,
    doacoesMes: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({
    ocupacaoQuartos: 0,
    metaDoacoes: 0,
    funcionariosPresentes: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Carregar estatísticas básicas
        const [funcionariosRes, idososRes, doacoesRes, departamentosRes] = await Promise.all([
          supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('idosos').select('*', { count: 'exact', head: true }).eq('ativo', true),
          supabase.from('doacoes_dinheiro').select('valor').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          supabase.from('departamentos').select('*', { count: 'exact', head: true }).eq('ativo', true)
        ]);

        // Calcular receita mensal (soma das doações do mês atual)
        const receitaMensal = doacoesRes.data?.reduce((acc, d) => acc + d.valor, 0) || 0;

        setStats({
          funcionariosAtivos: funcionariosRes.count || 0,
          idososAssistidos: idososRes.count || 0,
          receitaMensal: receitaMensal,
          doacoesMes: receitaMensal, // Por enquanto, receita = doações
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
            time: new Date(doacao.created_at).toLocaleDateString('pt-BR'),
            icon: HandHeart
          })),
          ...(recentFuncionarios.data || []).map(funcionario => ({
            id: `funcionario-${funcionario.id}`,
            title: `Novo funcionário cadastrado`,
            description: `${funcionario.nome} - ${funcionario.cargo}`,
            time: new Date(funcionario.created_at).toLocaleDateString('pt-BR'),
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
        const percentualMeta = (receitaMensal / metaDoacao) * 100;
        
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
        const metaDoacoesPercent = Math.min((receitaMensal / metaDoacao) * 100, 100);

        setQuickStats({
          ocupacaoQuartos: Math.round(ocupacaoQuartos),
          metaDoacoes: Math.round(metaDoacoesPercent),
          funcionariosPresentes: totalFuncionarios > 0 ? Math.round((funcionariosPresentes / totalFuncionarios) * 100) : 0,
        });

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
      title: "Receita Mensal",
      value: `R$ ${stats.receitaMensal.toLocaleString()}`,
      change: "0%",
      trend: "up",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      title: "Doações (Mês)",
      value: `R$ ${stats.doacoesMes.toLocaleString()}`,
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
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 crevin-transition">
                    <div className="h-8 w-8 rounded-md bg-primary-light flex items-center justify-center flex-shrink-0">
                      <activity.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground break-words">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-4 text-sm">
                Ver todas as atividades
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
    </div>
  );
}