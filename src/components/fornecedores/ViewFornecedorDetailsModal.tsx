import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Fornecedor } from "@/types";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2, 
  FileText, 
  Clock, 
  Briefcase, 
  Tag
} from "lucide-react";
import { formatBrazilianDate, formatBrazilianDateTime } from "@/lib/utils";

interface ViewFornecedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor: Fornecedor | null;
}

export function ViewFornecedorModal({
  open,
  onOpenChange,
  fornecedor,
}: ViewFornecedorModalProps) {
  if (!fornecedor) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "inativo":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "bloqueado":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTipoLabel = (tipo: string) => {
    return tipo === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física';
  };

  const formatDocument = (fornecedor: Fornecedor) => {
    if (fornecedor.tipo_pessoa === 'juridica' && fornecedor.cnpj) {
      return fornecedor.cnpj;
    }
    if (fornecedor.tipo_pessoa === 'fisica' && fornecedor.cpf) {
      return fornecedor.cpf;
    }
    return 'Não informado';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detalhes do Fornecedor
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações detalhadas do fornecedor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações Principais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Nome / Razão Social</label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{fornecedor.nome}</span>
                </div>
                {fornecedor.razao_social && (
                  <div className="text-xs text-muted-foreground ml-6">
                    Razão Social: {fornecedor.razao_social}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Documento ({fornecedor.tipo_pessoa === 'juridica' ? 'CNPJ' : 'CPF'})</label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{formatDocument(fornecedor)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Tipo</label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{getTipoLabel(fornecedor.tipo_pessoa)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Categoria</label>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm capitalize">{fornecedor.categoria || 'Não informada'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div>
                  <Badge className={getStatusBadge(fornecedor.status)}>
                    {getStatusLabel(fornecedor.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contato e Endereço */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Contato e Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">E-mail</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{fornecedor.email || 'Não informado'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Telefone / Celular</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="flex flex-col">
                    {fornecedor.telefone && <span className="text-sm">{fornecedor.telefone}</span>}
                    {fornecedor.celular && <span className="text-sm">{fornecedor.celular}</span>}
                    {!fornecedor.telefone && !fornecedor.celular && <span className="text-sm">Não informado</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Endereço Completo</label>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">
                    {[
                      fornecedor.endereco,
                      fornecedor.cidade,
                      fornecedor.estado,
                      fornecedor.cep
                    ].filter(Boolean).join(', ') || 'Endereço não informado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {fornecedor.observacoes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Observações</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {fornecedor.observacoes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Informações do Sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Data de Criação</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {formatBrazilianDateTime(fornecedor.created_at)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Última Atualização</label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {formatBrazilianDateTime(fornecedor.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
