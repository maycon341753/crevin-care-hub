import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DocumentosMedicosUploadProps {
  idosoId: string;
  onUploadSuccess?: () => void;
}

interface FileUpload {
  file: File;
  descricao: string;
  uploading: boolean;
  progress: number;
}

export function DocumentosMedicosUpload({ idosoId, onUploadSuccess }: DocumentosMedicosUploadProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { user } = useAuth();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} não é um arquivo PDF válido`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB
        toast.error(`${file.name} é muito grande. Máximo 50MB`);
        return false;
      }
      return true;
    });

    const fileUploads: FileUpload[] = validFiles.map(file => ({
      file,
      descricao: '',
      uploading: false,
      progress: 0
    }));

    setFiles(prev => [...prev, ...fileUploads]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateDescription = (index: number, descricao: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, descricao } : file
    ));
  };

  const uploadFile = async (fileUpload: FileUpload, index: number) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Atualizar estado para mostrar que está fazendo upload
      setFiles(prev => prev.map((file, i) => 
        i === index ? { ...file, uploading: true, progress: 0 } : file
      ));

      const fileName = `${Date.now()}_${fileUpload.file.name}`;
      const filePath = `${idosoId}/${fileName}`;

      // Upload do arquivo para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documentos-medicos')
        .upload(filePath, fileUpload.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Simular progresso
      setFiles(prev => prev.map((file, i) => 
        i === index ? { ...file, progress: 50 } : file
      ));

      // Salvar metadados no banco de dados
      const { error: dbError } = await supabase
        .from('documentos_medicos')
        .insert({
          idoso_id: idosoId,
          nome_arquivo: fileUpload.file.name,
          tipo_arquivo: fileUpload.file.type,
          tamanho_arquivo: fileUpload.file.size,
          caminho_storage: filePath,
          descricao: fileUpload.descricao || null,
          uploaded_by: user.id
        });

      if (dbError) {
        // Se falhou ao salvar no banco, remover do storage
        await supabase.storage
          .from('documentos-medicos')
          .remove([filePath]);
        throw dbError;
      }

      // Completar progresso
      setFiles(prev => prev.map((file, i) => 
        i === index ? { ...file, progress: 100 } : file
      ));

      toast.success(`${fileUpload.file.name} enviado com sucesso!`);

      // Remover da lista após 2 segundos
      setTimeout(() => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        onUploadSuccess?.();
      }, 2000);

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(`Erro ao enviar ${fileUpload.file.name}: ${error.message}`);
      
      // Resetar estado de upload
      setFiles(prev => prev.map((file, i) => 
        i === index ? { ...file, uploading: false, progress: 0 } : file
      ));
    }
  };

  const uploadAllFiles = async () => {
    const filesToUpload = files.filter(f => !f.uploading);
    
    for (let i = 0; i < files.length; i++) {
      if (!files[i].uploading) {
        await uploadFile(files[i], i);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Documentos Médicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Arraste arquivos PDF aqui
          </p>
          <p className="text-sm text-gray-500 mb-4">
            ou clique para selecionar arquivos
          </p>
          <Input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            ref={(input) => {
              if (input) {
                input.style.display = 'none';
              }
            }}
          />
          <Button 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => document.getElementById('file-upload')?.click()}
            type="button"
          >
            Selecionar Arquivos PDF
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Máximo 50MB por arquivo • Apenas arquivos PDF
          </p>
        </div>

        {/* Lista de Arquivos */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Arquivos Selecionados</h4>
            {files.map((fileUpload, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{fileUpload.file.name}</span>
                    <span className="text-sm text-gray-500">
                      ({(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  {!fileUpload.uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <Label htmlFor={`desc-${index}`} className="text-sm">
                    Descrição (opcional)
                  </Label>
                  <Textarea
                    id={`desc-${index}`}
                    placeholder="Descreva o conteúdo do documento..."
                    value={fileUpload.descricao}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    disabled={fileUpload.uploading}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Barra de Progresso */}
                {fileUpload.uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Enviando...</span>
                      <span>{fileUpload.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileUpload.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Botão de Upload */}
            <div className="flex justify-end">
              <Button
                onClick={uploadAllFiles}
                disabled={files.some(f => f.uploading) || files.length === 0}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Enviar Todos os Arquivos
              </Button>
            </div>
          </div>
        )}

        {/* Aviso sobre a criação da tabela */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Configuração Necessária</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Para usar esta funcionalidade, execute o arquivo <code>create_medical_documents_table.sql</code> no Supabase Dashboard para criar a tabela e configurar o storage.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}