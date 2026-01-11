import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  UserCheck, 
  Clock,
  Users,
  UserPlus,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Eye
} from "lucide-react";
import { AddListaEsperaModal } from "@/components/idosos/AddListaEsperaModal";
import { EditListaEsperaModal } from "@/components/idosos/EditListaEsperaModal";
import { TransferirIdosoModal } from "@/components/idosos/TransferirIdosoModal";
import { DetalhesListaEsperaModal } from "@/components/idosos/DetalhesListaEsperaModal";
import { useNavigate } from "react-router-dom";

interface IdosoListaEspera {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo?: 'masculino' | 'feminino';
  telefone?: string;
  endereco?: string;
  responsavel_nome?: string;
  responsavel_telefone?: string;
  responsavel_parentesco?: string;
  observacoes?: string;
  data_cadastro: string;
  posicao_fila: number;
  status: 'aguardando' | 'contatado' | 'transferido' | 'cancelado';
}

export default function ListaEsperaPage() {
  const [idosos, setIdosos] = useState<IdosoListaEspera[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIdoso, setSelectedIdoso] = useState<IdosoListaEspera | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sexoFiltro, setSexoFiltro] = useState<'todos' | 'masculino' | 'feminino'>('todos');

  const fetchIdosos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lista_espera_idosos')
        .select('*')
        .order('data_cadastro', { ascending: true })
        .order('posicao_fila', { ascending: true });

      if (error) throw error;
      setIdosos(data || []);
    } catch (error) {
      console.error('Erro ao carregar lista de espera:', error);
      toast.error('Erro ao carregar lista de espera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdosos();
  }, []);

  const filteredIdosos = idosos.filter(idoso =>
    idoso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idoso.cpf.includes(searchTerm) ||
    (idoso.responsavel_nome && idoso.responsavel_nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Separação por sexo
  const idososMasculinos = filteredIdosos.filter((i) => i.sexo === 'masculino');
  const idososFemininos = filteredIdosos.filter((i) => i.sexo === 'feminino');

  // Renderer de cartão para evitar duplicação
  const renderIdosoCard = (idoso: IdosoListaEspera) => (
    <Card key={idoso.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {idoso.nome}
          </CardTitle>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(idoso.status)}
            <Badge variant="outline" className="text-xs">
              Posição: {idoso.posicao_fila}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600">
          <p><strong>CPF:</strong> {idoso.cpf}</p>
          <p><strong>Idade:</strong> {calculateIdade(idoso.data_nascimento)} anos</p>
          <p><strong>Cadastro:</strong> {idoso.data_cadastro ? (() => {
            // Se for string ISO completa (ex: 2025-10-24T19:26:52...), pega só a data
            // Se for só data (ex: 2025-10-24), mantém
            const dataPart = idoso.data_cadastro.split('T')[0];
            const [year, month, day] = dataPart.split('-');
            return `${day}/${month}/${year}`;
          })() : '-'}</p>
        </div>

        {idoso.telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            {idoso.telefone}
          </div>
        )}

        {idoso.endereco && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            {idoso.endereco.length > 50 ? `${idoso.endereco.substring(0, 50)}...` : idoso.endereco}
          </div>
        )}

        {idoso.responsavel_nome && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Responsável:</p>
            <p className="text-sm text-gray-600">{idoso.responsavel_nome}</p>
            {idoso.responsavel_telefone && (
              <p className="text-sm text-gray-600">{idoso.responsavel_telefone}</p>
            )}
            {idoso.responsavel_parentesco && (
              <p className="text-xs text-gray-500">({idoso.responsavel_parentesco})</p>
            )}
          </div>
        )}

        {idoso.observacoes && (
          <div className="text-sm text-gray-600">
            <p><strong>Observações:</strong></p>
            <p className="text-xs bg-gray-50 p-2 rounded">
              {idoso.observacoes.length > 100 ? `${idoso.observacoes.substring(0, 100)}...` : idoso.observacoes}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(idoso)}
            className="flex-1 flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(idoso)}
            className="flex-1"
          >
            Editar
          </Button>
          {idoso.status === 'aguardando' && (
            <Button
              size="sm"
              onClick={() => handleTransfer(idoso)}
              className="flex-1 flex items-center gap-1"
            >
              <UserCheck className="h-3 w-3" />
              Transferir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const handleEdit = (idoso: IdosoListaEspera) => {
    setSelectedIdoso(idoso);
    setShowEditModal(true);
  };

  const handleTransfer = (idoso: IdosoListaEspera) => {
    setSelectedIdoso(idoso);
    setShowTransferModal(true);
  };

  const handleViewDetails = (idoso: IdosoListaEspera) => {
    setSelectedIdoso(idoso);
    setShowDetailsModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowTransferModal(false);
    setShowDetailsModal(false);
    setSelectedIdoso(null);
    fetchIdosos();
  };
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aguardando: { label: 'Aguardando', variant: 'default' as const },
      contatado: { label: 'Contatado', variant: 'secondary' as const },
      transferido: { label: 'Transferido', variant: 'success' as const },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.aguardando;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const calculateIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando lista de espera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/idosos')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Idosos
          </Button>
        </div>
         
         <div className="flex justify-between items-center mb-8">
         <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Lista de Espera
          </h1>
          <p className="text-gray-600 mt-2">
            Gerenciar idosos aguardando vaga na instituição
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar à Lista
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, CPF ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant={sexoFiltro === 'todos' ? 'default' : 'outline'}
            onClick={() => setSexoFiltro('todos')}
          >
            Todos
          </Button>
          <Button
            variant={sexoFiltro === 'masculino' ? 'default' : 'outline'}
            onClick={() => setSexoFiltro('masculino')}
          >
            Masculino
          </Button>
          <Button
            variant={sexoFiltro === 'feminino' ? 'default' : 'outline'}
            onClick={() => setSexoFiltro('feminino')}
          >
            Feminino
          </Button>
        </div>
      </div>

      {/* Conteúdo condicionado ao filtro */}
      {sexoFiltro === 'todos' && (
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Masculino ({idososMasculinos.length})
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {idososMasculinos.map(renderIdosoCard)}
              {idososMasculinos.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhum cadastro masculino.</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-600" />
              Feminino ({idososFemininos.length})
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {idososFemininos.map(renderIdosoCard)}
              {idososFemininos.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhum cadastro feminino.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {sexoFiltro === 'masculino' && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Masculino ({idososMasculinos.length})
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {idososMasculinos.map(renderIdosoCard)}
            {idososMasculinos.length === 0 && (
              <p className="text-gray-500 text-sm">Nenhum cadastro masculino.</p>
            )}
          </div>
        </div>
      )}

      {sexoFiltro === 'feminino' && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-600" />
            Feminino ({idososFemininos.length})
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {idososFemininos.map(renderIdosoCard)}
            {idososFemininos.length === 0 && (
              <p className="text-gray-500 text-sm">Nenhum cadastro feminino.</p>
            )}
          </div>
        </div>
      )}

      {sexoFiltro === 'todos' && (idososMasculinos.length + idososFemininos.length) === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum resultado encontrado' : 'Lista de espera vazia'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Tente ajustar os termos de busca'
              : 'Adicione idosos à lista de espera para começar'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar à Lista
            </Button>
          )}
        </div>
      )}

      <AddListaEsperaModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        onSuccess={fetchIdosos}
      />

      {selectedIdoso && (
        <DetalhesListaEsperaModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedIdoso(null);
          }}
          idoso={selectedIdoso}
        />
      )}

      {selectedIdoso && (
        <EditListaEsperaModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedIdoso(null);
            fetchIdosos();
          }}
          onSuccess={fetchIdosos}
          idoso={selectedIdoso}
        />
      )}

      {selectedIdoso && (
        <TransferirIdosoModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedIdoso(null);
          }}
          onTransferSuccess={() => {
            fetchIdosos();
            setShowTransferModal(false);
            setSelectedIdoso(null);
          }}
          idoso={selectedIdoso}
        />
      )}
    </div>
  );
}