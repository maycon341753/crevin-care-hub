import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBrazilianDate } from "@/lib/utils";

interface Advertencia {
  id: string;
  funcionario_id: string;
  tipo: 'verbal' | 'escrita' | 'suspensao' | 'advertencia_final';
  motivo: string;
  data_advertencia: string;
  status: 'ativa' | 'revogada' | 'cumprida';
  funcionario?: {
    nome: string;
    cargo: string;
  };
}

interface DeleteAdvertenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  advertencia: Advertencia | null;
}

export default function DeleteAdvertenciaModal({ open, onOpenChange, onSuccess, advertencia }: DeleteAdvertenciaModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!advertencia) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('advertencias')
        .delete()
        .eq('id', advertencia.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Advertência excluída com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir advertência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a advertência.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!advertencia) return null;

  const formatTipo = (tipo: string) => {
    const tipos = {
      'verbal': 'Verbal',
      'escrita': 'Escrita',
      'suspensao': 'Suspensão',
      'advertencia_final': 'Advertência Final'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const formatStatus = (status: string) => {
    const statuses = {
      'ativa': 'Ativa',
      'revogada': 'Revogada',
      'cumprida': 'Cumprida'
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir esta advertência? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              A exclusão de uma advertência é uma ação permanente e pode afetar o histórico disciplinar do funcionário.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div>
              <span className="font-medium">Funcionário:</span> {advertencia.funcionario?.nome}
            </div>
            <div>
              <span className="font-medium">Cargo:</span> {advertencia.funcionario?.cargo}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {formatTipo(advertencia.tipo)}
            </div>
            <div>
              <span className="font-medium">Motivo:</span> {advertencia.motivo}
            </div>
            <div>
              <span className="font-medium">Data:</span> {formatBrazilianDate(advertencia.data_advertencia)}
            </div>
            <div>
              <span className="font-medium">Status:</span> {formatStatus(advertencia.status)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir Advertência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}