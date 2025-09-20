import { useState } from "react";
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
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Departamento {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    funcionarios: number;
  };
}

interface DeleteDepartamentoModalProps {
  open: boolean;
  onClose: () => void;
  departamento: Departamento;
}

export function DeleteDepartamentoModal({ open, onClose, departamento }: DeleteDepartamentoModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setLoading(true);

      // Verificar se há funcionários vinculados
      const { count } = await supabase
        .from('funcionarios')
        .select('*', { count: 'exact', head: true })
        .eq('departamento_id', departamento.id);

      if (count && count > 0) {
        toast({
          title: "Erro",
          description: `Não é possível excluir o departamento pois há ${count} funcionário(s) vinculado(s).`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('departamentos')
        .delete()
        .eq('id', departamento.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Departamento excluído com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o departamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasFuncionarios = departamento._count?.funcionarios && departamento._count.funcionarios > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir Departamento
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O departamento será permanentemente removido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">{departamento.nome}</h4>
            {departamento.descricao && (
              <p className="text-sm text-muted-foreground mt-1">
                {departamento.descricao}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Funcionários vinculados: {departamento._count?.funcionarios || 0}
            </p>
          </div>

          {hasFuncionarios && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este departamento possui {departamento._count?.funcionarios} funcionário(s) vinculado(s). 
                Para excluí-lo, primeiro remova ou transfira todos os funcionários para outros departamentos.
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
            disabled={loading || hasFuncionarios}
          >
            {loading ? "Excluindo..." : "Excluir Departamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}