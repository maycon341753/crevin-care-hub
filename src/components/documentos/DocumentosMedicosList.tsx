import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  FileIcon,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
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

interface DocumentoMedico {
  id: string;
  idoso_id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_arquivo: number | null;
  caminho_storage: string;
  descricao: string | null;
  created_at: string;
  uploaded_by: string | null;
}

interface DocumentosMedicosListProps {
  idosoId: string;
  refreshTrigger?: number;
}

export function DocumentosMedicosList({ idosoId, refreshTrigger }: DocumentosMedicosListProps) {
  const [documentos, setDocumentos] = useState<DocumentoMedico[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('documentos_medicos')
        .select('*')
        .eq('idoso_id', idosoId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDocumentos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos médicos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [idosoId, refreshTrigger]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Tamanho desconhecido';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadDocument = async (documento: DocumentoMedico) => {
    try {
      setDownloading(documento.id);

      const { data, error } = await supabase.storage
        .from('documentos-medicos')
        .download(documento.caminho_storage);

      if (error) {
        throw error;
      }

      // Criar URL para download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.nome_arquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado!');
    } catch (error: any) {
      console.error('Erro no download:', error);
      toast.error('Erro ao fazer download do documento');
    } finally {
      setDownloading(null);
    }
  };

  const viewDocument = async (documento: DocumentoMedico) => {
    try {
      const { data, error } = await supabase.storage
        .from('documentos-medicos')
        .createSignedUrl(documento.caminho_storage, 3600); // 1 hora

      if (error) {
        throw error;
      }

      // Abrir em nova aba
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error('Erro ao visualizar documento:', error);
      toast.error('Erro ao visualizar documento');
    }
  };

  const deleteDocument = async (documento: DocumentoMedico) => {
    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('documentos-medicos')
        .remove([documento.caminho_storage]);

      if (storageError) {
        throw storageError;
      }

      // Deletar do banco de dados
      const { error: dbError } = await supabase
        .from('documentos_medicos')
        .delete()
        .eq('id', documento.id);

      if (dbError) {
        throw dbError;
      }

      toast.success('Documento excluído com sucesso!');
      fetchDocumentos(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao excluir documento:', error);
      toast.error('Erro ao excluir documento');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando documentos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos Médicos ({documentos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documentos.length === 0 ? (
          <div className="text-center py-8">
            <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum documento médico encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              Use o upload acima para adicionar documentos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documentos.map((documento) => (
              <div
                key={documento.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <h4 className="font-medium text-gray-900 truncate">
                        {documento.nome_arquivo}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        PDF
                      </Badge>
                    </div>

                    {documento.descricao && (
                      <p className="text-sm text-gray-600 mb-2">
                        {documento.descricao}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(documento.created_at)}
                      </div>
                      
                      {documento.tamanho_arquivo && (
                        <div className="flex items-center gap-1">
                          <FileIcon className="h-3 w-3" />
                          {formatFileSize(documento.tamanho_arquivo)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDocument(documento)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Ver
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(documento)}
                      disabled={downloading === documento.id}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      {downloading === documento.id ? 'Baixando...' : 'Baixar'}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o documento "{documento.nome_arquivo}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDocument(documento)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aviso sobre configuração */}
        {documentos.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Funcionalidade de Documentos</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Esta seção permite que médicos compartilhem documentos PDF relacionados ao paciente. 
                  Todos os usuários autenticados podem visualizar e fazer download dos documentos.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}