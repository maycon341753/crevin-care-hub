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
import IdososPage from "./pages/idosos/IdososPage";
import ProfilesPage from "./pages/profiles/ProfilesPage";
import AuditLogsPage from "./pages/audit/AuditLogsPage";
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
            <Route path="/departamentos" element={<ProtectedRoute><DepartamentosPage /></ProtectedRoute>} />
            <Route path="/idosos" element={<ProtectedRoute><IdososPage /></ProtectedRoute>} />
            <Route path="/profiles" element={<ProtectedRoute><ProfilesPage /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
            
            {/* Placeholder routes for other modules */}
            <Route path="/idosos" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulo de Idosos em Desenvolvimento</h1></div></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulo Financeiro em Desenvolvimento</h1></div></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulo de Fornecedores em Desenvolvimento</h1></div></ProtectedRoute>} />
            <Route path="/obrigacoes" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulo de Obrigações em Desenvolvimento</h1></div></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulo de Agenda em Desenvolvimento</h1></div></ProtectedRoute>} />
            <Route path="/lembretes" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulo de Lembretes em Desenvolvimento</h1></div></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulos Administrativos em Desenvolvimento</h1></div></ProtectedRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
