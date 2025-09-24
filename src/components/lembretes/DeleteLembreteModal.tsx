import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

interface Lembrete {
  id: string;
  titulo: string;
  descricao?: string;
  data_lembrete: string;
  tipo: string;
  prioridade: string;
  status: string;
}

interface DeleteLembreteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lembrete: Lembrete;
  onSuccess: () => void;
}

export default function DeleteLembreteModal({ open, onOpenChange, lembrete, onSuccess }: DeleteLembreteModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('lembretes')
        .delete()
        .eq('id', lembrete.id);

      if (error) {
        console.error('Erro ao excluir lembrete:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o lembrete.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Lembrete excluído com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir lembrete.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBrazilianDate = (isoDate: string) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O lembrete será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <span className="font-medium">Título:</span> {lembrete.titulo}
            </div>
            {lembrete.descricao && (
              <div>
                <span className="font-medium">Descrição:</span> {lembrete.descricao}
              </div>
            )}
            <div>
              <span className="font-medium">Data:</span> {formatBrazilianDate(lembrete.data_lembrete)}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {lembrete.tipo.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Prioridade:</span> {lembrete.prioridade.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Status:</span> {lembrete.status.toUpperCase()}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir Lembrete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}