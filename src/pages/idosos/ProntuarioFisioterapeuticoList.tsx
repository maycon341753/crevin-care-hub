import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Search, User, Calendar, Activity, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProntuarioFisioterapeuticoListItem {
  id: string;
  idoso_id: string;
  created_at: string;
  updated_at: string;
  diagnostico_fisioterapeutico: string;
  objetivos_tratamento: string;
  idoso: {
    nome: string;
    data_nascimento: string;
    quarto: string;
  };
}

export default function ProntuarioFisioterapeuticoList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [prontuarios, setProntuarios] = useState<ProntuarioFisioterapeuticoListItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProntuario, setSelectedProntuario] = useState<ProntuarioFisioterapeuticoListItem | null>(null);

  useEffect(() => {
    fetchProntuarios();
  }, []);

  const fetchProntuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prontuario_fisioterapeutico')
        .select(`
          id,
          idoso_id,
          created_at,
          updated_at,
          diagnostico_fisioterapeutico,
          objetivos_tratamento,
          idoso:idosos (
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
          description: "Não foi possível carregar os prontuários fisioterapêuticos.",
          variant: "destructive",
        });
        return;
      }

      setProntuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar prontuários:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar os prontuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const filteredProntuarios = prontuarios.filter(prontuario =>
    prontuario.idoso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prontuario.idoso.quarto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const openDetails = (prontuario: ProntuarioFisioterapeuticoListItem) => {
    setSelectedProntuario(prontuario);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedProntuario(null);
  };

  const deleteProntuario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prontuario_fisioterapeutico')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir prontuário:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o prontuário.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Prontuário excluído com sucesso.",
      });

      // Recarregar a lista
      fetchProntuarios();
    } catch (error) {
      console.error('Erro ao excluir prontuário:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir o prontuário.",
        variant: "destructive",
      });
    }
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
    <>
      <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Avaliações Fisioterapêuticas
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as avaliações fisioterapêuticas dos idosos
            </p>
          </div>
          <Button
            onClick={() => navigate("/idosos")}
            className="w-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Avaliação
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
                  <p className="text-sm text-muted-foreground">Total de Avaliações</p>
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
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold">
                    {prontuarios.filter(p => {
                      const created = new Date(p.created_at);
                      const now = new Date();
                      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pacientes Únicos</p>
                  <p className="text-2xl font-bold">
                    {new Set(prontuarios.map(p => p.idoso_id)).size}
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
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Não há avaliações que correspondam à sua busca."
                    : "Ainda não há avaliações fisioterapêuticas cadastradas."
                  }
                </p>
                <Button onClick={() => navigate("/idosos")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Avaliação
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
                    <Badge variant="default">
                      Fisioterapia
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Atualizado em {formatDate(prontuario.updated_at)}</span>
                    </div>
                    {prontuario.diagnostico_fisioterapeutico && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        <strong>Diagnóstico:</strong> {prontuario.diagnostico_fisioterapeutico}
                      </p>
                    )}
                    {prontuario.objetivos_tratamento && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        <strong>Objetivos:</strong> {prontuario.objetivos_tratamento}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetails(prontuario)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver informações
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/idosos/${prontuario.idoso_id}/prontuario-fisioterapeutico`)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a avaliação fisioterapêutica de {prontuario.idoso.nome}? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteProntuario(prontuario.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>

    <Dialog open={showDetails} onOpenChange={(open) => !open && closeDetails()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Informações da Avaliação</DialogTitle>
          {selectedProntuario && (
            <DialogDescription>
              {selectedProntuario.idoso.nome} • {calculateAge(selectedProntuario.idoso.data_nascimento)} anos
              {selectedProntuario.idoso.quarto && ` • Quarto ${selectedProntuario.idoso.quarto}`}
            </DialogDescription>
          )}
        </DialogHeader>

        {selectedProntuario && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Atualizado em {formatDate(selectedProntuario.updated_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Criado em {formatDate(selectedProntuario.created_at)}</span>
            </div>

            {selectedProntuario.diagnostico_fisioterapeutico && (
              <div>
                <p className="text-sm font-medium">Diagnóstico</p>
                <p className="text-sm text-muted-foreground">
                  {selectedProntuario.diagnostico_fisioterapeutico}
                </p>
              </div>
            )}

            {selectedProntuario.objetivos_tratamento && (
              <div>
                <p className="text-sm font-medium">Objetivos do Tratamento</p>
                <p className="text-sm text-muted-foreground">
                  {selectedProntuario.objetivos_tratamento}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button variant="outline" onClick={closeDetails} className="w-full">Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}