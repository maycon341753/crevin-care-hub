import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface DeleteProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
}

export function DeleteProfileModal({ open, onClose, profile }: DeleteProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [checkingDependencies, setCheckingDependencies] = useState(false);
  const { toast } = useToast();

  const checkDependencies = async (profileId: string) => {
    setCheckingDependencies(true);
    const deps: string[] = [];

    try {
      // Verificar se o usuário tem registros relacionados
      // Aqui você pode adicionar verificações para outras tabelas que referenciam profiles
      
      // Exemplo: verificar se há registros de auditoria
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('user_id', profileId)
        .limit(1);

      if (auditLogs && auditLogs.length > 0) {
        deps.push('Registros de auditoria');
      }

      // Verificar se há doações associadas
      const { data: doacoes } = await supabase
        .from('doacoes')
        .select('id')
        .eq('responsavel_id', profileId)
        .limit(1);

      if (doacoes && doacoes.length > 0) {
        deps.push('Doações como responsável');
      }

      setDependencies(deps);
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
    } finally {
      setCheckingDependencies(false);
    }
  };

  useEffect(() => {
    if (open && profile) {
      checkDependencies(profile.id);
    }
  }, [open, profile]);

  const handleDelete = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">Usuário a ser excluído:</h4>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Nome:</strong> {profile.full_name || 'Não informado'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>ID:</strong> {profile.id}
            </p>
          </div>

          {checkingDependencies && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando dependências...
            </div>
          )}

          {!checkingDependencies && dependencies.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Este usuário possui registros relacionados:
                <ul className="list-disc list-inside mt-2">
                  {dependencies.map((dep, index) => (
                    <li key={index}>{dep}</li>
                  ))}
                </ul>
                A exclusão removerá permanentemente todos estes dados relacionados.
              </AlertDescription>
            </Alert>
          )}

          {!checkingDependencies && dependencies.length === 0 && (
            <Alert>
              <AlertDescription>
                Este usuário não possui registros relacionados e pode ser excluído com segurança.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || checkingDependencies}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}