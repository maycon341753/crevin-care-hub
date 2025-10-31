import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Search, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProntuarioMedicoListItem {
  id: string;
  idoso_id: string;
  created_at: string;
  updated_at: string;
  status: 'ativo' | 'inativo';
  idoso: {
    nome: string;
    data_nascimento: string;
    quarto: string;
  };
}

interface IdosoSimple {
  id: string;
  nome: string;
  quarto?: string | null;
}

export default function ProntuarioMedicoList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [prontuarios, setProntuarios] = useState<ProntuarioMedicoListItem[]>([]);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [idosos, setIdosos] = useState<IdosoSimple[]>([]);
  const [selectedIdosoId, setSelectedIdosoId] = useState<string>("");

  useEffect(() => {
    fetchProntuarios();
    fetchIdosos();
  }, []);

  const fetchProntuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prontuario_medico')
        .select(`
          id,
          idoso_id,
          created_at,
          updated_at,
          status,
          idoso:idosos!inner(
            nome,
            data_nascimento,
            quarto
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar prontuários médicos:', error);
        toast({ title: "Erro", description: "Não foi possível carregar os prontuários médicos.", variant: "destructive" });
        return;
      }

      setProntuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar prontuários médicos:', error);
      toast({ title: "Erro", description: "Erro inesperado ao carregar os dados.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchIdosos = async () => {
    try {
      const { data, error } = await supabase
        .from('idosos')
        .select('id, nome, quarto, status')
        .eq('status', 'ativo')
        .order('nome', { ascending: true });
      if (error) {
        console.error('Erro ao buscar idosos:', error);
        toast({ title: "Erro", description: "Não foi possível carregar a lista de idosos.", variant: "destructive" });
        return;
      }
      setIdosos((data || []).map(i => ({ id: i.id, nome: i.nome, quarto: i.quarto })));
    } catch (error) {
      console.error('Erro ao carregar idosos:', error);
      toast({ title: "Erro", description: "Erro inesperado ao carregar os idosos.", variant: "destructive" });
    }
  };

  const handleCreateProntuario = () => {
    if (!selectedIdosoId) {
      toast({ title: "Selecione um idoso", description: "Escolha o idoso para criar o prontuário médico.", variant: "destructive" });
      return;
    }
    setIsNewOpen(false);
    navigate(`/idosos/${selectedIdosoId}/prontuario-medico`);
  };

  const filtered = prontuarios.filter(p =>
    p.idoso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.idoso.quarto || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Prontuários Médicos
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Registros clínicos por idoso</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/idosos')}>
              <User className="h-4 w-4 mr-2" /> Ir para Idosos
            </Button>
            <Button onClick={() => setIsNewOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo Prontuário
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar</CardTitle>
            <CardDescription>Filtre por nome ou quarto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome do idoso ou quarto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <Card><CardContent className="p-6">Carregando...</CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-6">Nenhum prontuário encontrado.</CardContent></Card>
          ) : (
            filtered.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" /> {p.idoso.nome}
                  </CardTitle>
                  <CardDescription>Quarto: {p.idoso.quarto || '—'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Atualizado: {new Date(p.updated_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <Badge variant={p.status === 'ativo' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/idosos/${p.idoso_id}/prontuario-medico`)} className="flex-1">
                      <FileText className="h-4 w-4 mr-2" /> Ver Prontuário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal: Novo Prontuário */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Prontuário Médico</DialogTitle>
            <DialogDescription>Selecione o idoso para criar/editar o prontuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Idoso</Label>
              <Select value={selectedIdosoId} onValueChange={setSelectedIdosoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um idoso" />
                </SelectTrigger>
                <SelectContent>
                  {idosos.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nome} {i.quarto ? `(Quarto ${i.quarto})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProntuario}><Plus className="h-4 w-4 mr-2" /> Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}