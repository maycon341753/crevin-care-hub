import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, AlertTriangle, FileText, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Advertencia {
  id: string;
  funcionario_id: string;
  tipo: 'verbal' | 'escrita' | 'suspensao' | 'advertencia_final';
  motivo: string;
  descricao?: string;
  data_advertencia: string;
  aplicada_por?: string;
  status: 'ativa' | 'revogada' | 'cumprida';
  data_revogacao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  funcionario?: {
    nome: string;
    cargo: string;
  };
  aplicada_por_user?: {
    email: string;
  };
}

export default function AdvertenciasPage() {
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdvertencia, setSelectedAdvertencia] = useState<Advertencia | null>(null);
  const { toast } = useToast();

  const fetchAdvertencias = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar advertências com dados do funcionário
      const { data: advertenciasData, error: advertenciasError } = await supabase
        .from('advertencias')
        .select(`
          *,
          funcionario:funcionarios(nome, cargo),
          aplicada_por_user:profiles!advertencias_aplicada_por_fkey(email)
        `)
        .order('data_advertencia', { ascending: false });

      if (advertenciasError) throw advertenciasError;

      setAdvertencias(advertenciasData || []);
    } catch (error) {
      console.error('Erro ao carregar advertências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as advertências.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdvertencias();
  }, [fetchAdvertencias]);

  const filteredAdvertencias = advertencias.filter(adv =>
    adv.funcionario?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adv.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adv.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (advertencia: Advertencia) => {
    setSelectedAdvertencia(advertencia);
    setShowEditModal(true);
  };

  const handleDelete = (advertencia: Advertencia) => {
    setSelectedAdvertencia(advertencia);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedAdvertencia(null);
    fetchAdvertencias();
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'verbal':
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 'escrita':
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case 'suspensao':
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case 'advertencia_final':
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case 'revogada':
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case 'cumprida':
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'verbal':
        return <AlertTriangle className="h-4 w-4" />;
      case 'escrita':
        return <FileText className="h-4 w-4" />;
      case 'suspensao':
        return <Clock className="h-4 w-4" />;
      case 'advertencia_final':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa':
        return <AlertTriangle className="h-4 w-4" />;
      case 'revogada':
        return <Clock className="h-4 w-4" />;
      case 'cumprida':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advertências</h1>
          <p className="text-muted-foreground">
            Gerencie as advertências aplicadas aos funcionários
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Advertência
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Advertências</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advertencias.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertências Ativas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {advertencias.filter(a => a.status === 'ativa').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertências Revogadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {advertencias.filter(a => a.status === 'revogada').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertências Cumpridas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {advertencias.filter(a => a.status === 'cumprida').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Advertências</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as advertências aplicadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar advertências..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aplicada por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdvertencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhuma advertência encontrada." : "Nenhuma advertência cadastrada."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdvertencias.map((advertencia) => (
                    <TableRow key={advertencia.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{advertencia.funcionario?.nome || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{advertencia.funcionario?.cargo || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoBadge(advertencia.tipo)}>
                          <div className="flex items-center gap-1">
                            {getTipoIcon(advertencia.tipo)}
                            {advertencia.tipo.replace('_', ' ').toUpperCase()}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={advertencia.motivo}>
                          {advertencia.motivo}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(advertencia.data_advertencia).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(advertencia.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(advertencia.status)}
                            {advertencia.status.toUpperCase()}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {advertencia.aplicada_por_user?.email || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(advertencia)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(advertencia)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modais - Serão implementados posteriormente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Nova Advertência</h2>
            <p className="text-muted-foreground mb-4">
              Funcionalidade em desenvolvimento. Modal será implementado em breve.
            </p>
            <Button onClick={() => setShowAddModal(false)}>Fechar</Button>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Editar Advertência</h2>
            <p className="text-muted-foreground mb-4">
              Funcionalidade em desenvolvimento. Modal será implementado em breve.
            </p>
            <Button onClick={() => setShowEditModal(false)}>Fechar</Button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Excluir Advertência</h2>
            <p className="text-muted-foreground mb-4">
              Funcionalidade em desenvolvimento. Modal será implementado em breve.
            </p>
            <Button onClick={() => setShowDeleteModal(false)}>Fechar</Button>
          </div>
        </div>
      )}
    </div>
  );
}