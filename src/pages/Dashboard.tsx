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

const statsCards = [
  {
    title: "Funcionários Ativos",
    value: "47",
    change: "+2",
    trend: "up",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary-light",
  },
  {
    title: "Idosos Assistidos",
    value: "142",
    change: "+5",
    trend: "up", 
    icon: Heart,
    color: "text-secondary",
    bgColor: "bg-secondary-light",
  },
  {
    title: "Receita Mensal",
    value: "R$ 89.450",
    change: "-3.2%",
    trend: "down",
    icon: DollarSign,
    color: "text-success",
    bgColor: "bg-success-light",
  },
  {
    title: "Doações (Mês)",
    value: "R$ 12.340",
    change: "+12%",
    trend: "up",
    icon: HandHeart,
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "funcionario",
    title: "Novo funcionário cadastrado",
    description: "Maria Silva - Técnica de Enfermagem",
    time: "2 horas atrás",
    icon: Users,
  },
  {
    id: 2,
    type: "doacao",
    title: "Doação recebida",
    description: "R$ 500,00 via PIX - João Santos",
    time: "4 horas atrás",
    icon: HandHeart,
  },
  {
    id: 3,
    type: "idoso",
    title: "Novo idoso admitido",
    description: "Antônio Oliveira - Quarto 15A",
    time: "1 dia atrás",
    icon: Heart,
  },
  {
    id: 4,
    type: "financeiro",
    title: "Pagamento de fornecedor",
    description: "Farmácia Central - R$ 2.450,00",
    time: "2 dias atrás",
    icon: DollarSign,
  },
];

const alerts = [
  {
    id: 1,
    type: "warning",
    title: "Verificar relatórios nutricionista",
    description: "Lembrete automático - Segunda e Quarta",
    priority: "high",
  },
  {
    id: 2,
    type: "info",
    title: "DAS vence em 5 dias",
    description: "Não esqueça de gerar o DAS mensal",
    priority: "medium",
  },
  {
    id: 3,
    type: "success",
    title: "Backup realizado",
    description: "Backup automático concluído com sucesso",
    priority: "low",
  },
];

export default function Dashboard() {
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
              {recentActivity.map((activity) => (
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
              ))}
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
              {alerts.map((alert) => (
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
              ))}
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