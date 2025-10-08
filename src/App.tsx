import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loader2 } from "lucide-react";

// Pages
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import FuncionariosPage from "./pages/funcionarios/FuncionariosPage";
import NovoFuncionarioPage from "./pages/funcionarios/NovoFuncionarioPage";
import AdvertenciasPage from "./pages/funcionarios/AdvertenciasPage";
import DepartamentosPage from "./pages/departamentos/DepartamentosPage";
import DoacoesPage from "./pages/doacoes/DoacoesPage";
import DoacoesDinheiroPage from "./pages/doacoes/DoacoesDinheiroPage";
import IdososPage from "./pages/idosos/IdososPage";
import QuartosPage from "./pages/idosos/QuartosPage";
import SaudePage from "./pages/idosos/SaudePage";
import { NovoIdosoPage } from "./pages/idosos/NovoIdosoPage";
import ListaEsperaPage from "./pages/idosos/ListaEsperaPage";
import ProntuarioNutricional from "./pages/idosos/ProntuarioNutricional";
import ProntuarioNutricionalList from "./pages/idosos/ProntuarioNutricionalList";
import FinanceiroPage from "./pages/financeiro/FinanceiroPage";
import ContasPagarPage from "./pages/financeiro/ContasPagarPage";
import ContasReceberPage from "./pages/financeiro/ContasReceberPage";
import ReceitasFuturasPage from "./pages/financeiro/ReceitasFuturasPage";
import ConciliacaoPage from "./pages/financeiro/ConciliacaoPage";
import ContasBancariasPage from "./pages/financeiro/ContasBancariasPage";
import NovoFornecedorPage from "./pages/fornecedores/NovoFornecedorPage";
import FornecedoresPage from "./pages/fornecedores/FornecedoresPage";
import EditarFornecedorPage from "./pages/fornecedores/EditarFornecedorPage";
import NotasFiscaisPage from "./pages/fornecedores/NotasFiscaisPage";
import LembretesPage from "./pages/LembretesPage";
import ProfilesPage from "./pages/profiles/ProfilesPage";
import AuditLogsPage from "./pages/audit/AuditLogsPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import AgendaPage from "./pages/agenda/AgendaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/auth" 
              element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/funcionarios" element={<ProtectedRoute><FuncionariosPage /></ProtectedRoute>} />
            <Route path="/funcionarios/novo" element={<ProtectedRoute><NovoFuncionarioPage /></ProtectedRoute>} />
            <Route path="/funcionarios/advertencias" element={<ProtectedRoute><AdvertenciasPage /></ProtectedRoute>} />
            <Route path="/funcionarios/departamentos" element={<ProtectedRoute><DepartamentosPage /></ProtectedRoute>} />
            <Route path="/doacoes" element={<ProtectedRoute><DoacoesPage /></ProtectedRoute>} />
            <Route path="/doacoes/dinheiro" element={<ProtectedRoute><DoacoesDinheiroPage /></ProtectedRoute>} />
            <Route path="/departamentos" element={<ProtectedRoute><DepartamentosPage /></ProtectedRoute>} />
            <Route path="/idosos" element={<ProtectedRoute><IdososPage /></ProtectedRoute>} />
            <Route path="/idosos/novo" element={<ProtectedRoute><NovoIdosoPage /></ProtectedRoute>} />
            <Route path="/idosos/lista-espera" element={<ProtectedRoute><ListaEsperaPage /></ProtectedRoute>} />
            <Route path="/idosos/quartos" element={<ProtectedRoute><QuartosPage /></ProtectedRoute>} />
            <Route path="/idosos/saude" element={<ProtectedRoute><SaudePage /></ProtectedRoute>} />
            <Route path="/idosos/prontuario-nutricional" element={<ProtectedRoute><ProntuarioNutricionalList /></ProtectedRoute>} />
            <Route path="/idosos/:idosoId/prontuario-nutricional" element={<ProtectedRoute><ProntuarioNutricional /></ProtectedRoute>} />
            <Route path="/profiles" element={<ProtectedRoute><ProfilesPage /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />

            {/* Módulos Financeiros */}
            <Route path="/financeiro" element={<ProtectedRoute><FinanceiroPage /></ProtectedRoute>} />
            <Route path="/financeiro/contas-pagar" element={<ProtectedRoute><ContasPagarPage /></ProtectedRoute>} />
            <Route path="/financeiro/contas-receber" element={<ProtectedRoute><ContasReceberPage /></ProtectedRoute>} />
            <Route path="/financeiro/receitas-futuras" element={<ProtectedRoute><ReceitasFuturasPage /></ProtectedRoute>} />
            <Route path="/financeiro/contas-bancarias" element={<ProtectedRoute><ContasBancariasPage /></ProtectedRoute>} />
            <Route path="/financeiro/conciliacao" element={<ProtectedRoute><ConciliacaoPage /></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><FornecedoresPage /></ProtectedRoute>} />
            <Route path="/fornecedores/novo" element={<ProtectedRoute><NovoFornecedorPage /></ProtectedRoute>} />
            <Route path="/fornecedores/editar/:id" element={<ProtectedRoute><EditarFornecedorPage /></ProtectedRoute>} />
            <Route path="/fornecedores/notas" element={<ProtectedRoute><NotasFiscaisPage /></ProtectedRoute>} />
            <Route path="/obrigacoes" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulo de Obrigações em Desenvolvimento</h1></div></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
            <Route path="/lembretes" element={<ProtectedRoute><LembretesPage /></ProtectedRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
