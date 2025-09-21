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
        const [funcionariosRes, idososRes, doacoesRes] = await Promise.all([
          supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('idosos').select('*', { count: 'exact', head: true }).eq('ativo', true),
          supabase.from('doacoes_dinheiro').select('valor').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);

        setStats({
          funcionariosAtivos: funcionariosRes.count || 0,
          idososAssistidos: idososRes.count || 0,
          receitaMensal: 0, // Será implementado quando houver tabela de receitas
          doacoesMes: doacoesRes.data?.reduce((acc, d) => acc + d.valor, 0) || 0,
        });

        // Carregar atividades recentes (simulado por enquanto)
        setRecentActivity([]);
        
        // Carregar alertas (simulado por enquanto)
        setAlerts([]);
        
        // Carregar estatísticas rápidas (simulado por enquanto)
        setQuickStats({
          ocupacaoQuartos: 0,
          metaDoacoes: 0,
          funcionariosPresentes: 0,
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={stat.trend === "up" ? "text-success" : "text-destructive"}>
                  {stat.change}
                </span>
                <span>do mês anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="crevin-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Atividades Recentes
              </CardTitle>
              <CardDescription>
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 crevin-transition">
                    <div className="h-8 w-8 rounded-md bg-primary-light flex items-center justify-center flex-shrink-0">
                      <activity.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-4">
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
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Lembretes & Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum alerta no momento</p>
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
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                      <Badge
                        variant={
                          alert.priority === "high"
                            ? "destructive"
                            : alert.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
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
                  <span>Ocupação de Quartos</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Meta de Doações</span>
                  <span>67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Funcionários Presentes</span>
                  <span>89%</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}