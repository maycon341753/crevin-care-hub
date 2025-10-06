import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Search, User, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Idoso } from "@/types";

interface ProntuarioNutricionalListItem {
  id: string;
  idoso_id: string;
  created_at: string;
  updated_at: string;
  mna_score: number | null;
  status_nutricional: string;
  diagnostico_nutricional: string;
  idoso: {
    nome: string;
    data_nascimento: string;
    quarto: string;
  };
}

export default function ProntuarioNutricionalList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [prontuarios, setProntuarios] = useState<ProntuarioNutricionalListItem[]>([]);

  useEffect(() => {
    fetchProntuarios();
  }, []);

  const fetchProntuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prontuario_nutricional')
        .select(`
          id,
          idoso_id,
          created_at,
          updated_at,
          mna_score,
          status_nutricional,
          diagnostico_nutricional,
          idoso:idosos!inner(
            nome,
            data_nascimento,
            quarto
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar prontuários:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os prontuários nutricionais.",
          variant: "destructive",
        });
        return;
      }

      setProntuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar prontuários:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProntuarios = prontuarios.filter(prontuario =>
    prontuario.idoso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prontuario.idoso.quarto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    if (!status) return "secondary";
    if (status.includes("normal")) return "default";
    if (status.includes("risco")) return "secondary";
    return "destructive";
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Prontuários Nutricionais
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie os prontuários nutricionais dos idosos
            </p>
          </div>
          <Button
            onClick={() => navigate("/idosos")}
            className="w-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Prontuário
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome do idoso ou quarto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Prontuários</p>
                  <p className="text-2xl font-bold">{prontuarios.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Estado Normal</p>
                  <p className="text-2xl font-bold">
                    {prontuarios.filter(p => p.status_nutricional?.includes("normal")).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Em Risco</p>
                  <p className="text-2xl font-bold">
                    {prontuarios.filter(p => p.status_nutricional?.includes("risco")).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prontuários List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProntuarios.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum prontuário encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Não há prontuários que correspondam à sua busca."
                    : "Ainda não há prontuários nutricionais cadastrados."
                  }
                </p>
                <Button onClick={() => navigate("/idosos")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Prontuário
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredProntuarios.map((prontuario) => (
              <Card key={prontuario.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{prontuario.idoso.nome}</CardTitle>
                        <CardDescription>
                          {calculateAge(prontuario.idoso.data_nascimento)} anos
                          {prontuario.idoso.quarto && ` • Quarto ${prontuario.idoso.quarto}`}
                        </CardDescription>
                      </div>
                    </div>
                    {prontuario.status_nutricional && (
                      <Badge variant={getStatusBadgeVariant(prontuario.status_nutricional)}>
                        {prontuario.status_nutricional}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {prontuario.mna_score !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Score MNA: {prontuario.mna_score}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Atualizado em {formatDate(prontuario.updated_at)}</span>
                    </div>
                    {prontuario.diagnostico_nutricional && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {prontuario.diagnostico_nutricional}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/idosos/${prontuario.idoso_id}/prontuario-nutricional`)}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Prontuário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}