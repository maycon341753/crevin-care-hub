import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Idoso {
  id: string;
  nome: string;
  cpf: string;
  ativo: boolean;
}

interface DeleteIdosoModalProps {
  open: boolean;
  onClose: () => void;
  idoso: Idoso;
}

export function DeleteIdosoModal({ open, onClose, idoso }: DeleteIdosoModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkingDependencies, setCheckingDependencies] = useState(false);
  const [hasDependencies, setHasDependencies] = useState(false);
  const [dependencyMessage, setDependencyMessage] = useState("");
  const { toast } = useToast();

  const checkDependencies = useCallback(async () => {
    if (!open || !idoso) return;

    try {
      setCheckingDependencies(true);
      setHasDependencies(false);
      setDependencyMessage("");

      // Verificar se há registros relacionados em outras tabelas
      // Por exemplo, se houver tabelas que referenciam idosos
      
      // Aqui você pode adicionar verificações para outras tabelas que referenciam idosos
      // Por exemplo: atividades, consultas médicas, etc.
      
      // Para este exemplo, vamos assumir que não há dependências críticas
      // mas você pode expandir conforme necessário
      
      setHasDependencies(false);
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
      setHasDependencies(false);
    } finally {
      setCheckingDependencies(false);
    }
  }, [open, idoso]);

  // Verificar dependências quando o modal abrir
  useEffect(() => {
    if (open && idoso) {
      checkDependencies();
    }
  }, [open, idoso, checkDependencies]);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('idosos')
        .delete()
        .eq('id', idoso.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Idoso removido com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao remover idoso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o idoso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (checkingDependencies) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verificando dependências...</DialogTitle>
            <DialogDescription>
              Aguarde enquanto verificamos se este idoso pode ser removido.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O idoso será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Idoso a ser removido:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Nome:</strong> {idoso.nome}</p>
              <p><strong>CPF:</strong> {formatCPF(idoso.cpf)}</p>
              <p><strong>Status:</strong> {idoso.ativo ? "Ativo" : "Inativo"}</p>
            </div>
          </div>

          {hasDependencies && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {dependencyMessage}
              </AlertDescription>
            </Alert>
          )}

          {!hasDependencies && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tem certeza que deseja remover este idoso? Esta ação é irreversível.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || hasDependencies}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remover Idoso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}