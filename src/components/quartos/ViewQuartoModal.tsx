import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Quarto } from "@/types/quarto";
import { Bed, Home, Users, MapPin, Info, DollarSign } from "lucide-react";

interface ViewQuartoModalProps {
  open: boolean;
  onClose: () => void;
  quarto: Quarto;
}

export function ViewQuartoModal({ open, onClose, quarto }: ViewQuartoModalProps) {
  const statusClasses = {
    disponivel: "bg-green-100 text-green-800 border-green-200",
    ocupado: "bg-red-100 text-red-800 border-red-200",
    manutencao: "bg-yellow-100 text-yellow-800 border-yellow-200",
    reservado: "bg-blue-100 text-blue-800 border-blue-200",
  } as const;

  const tipoLabel = {
    individual: "Individual",
    duplo: "Duplo",
    coletivo: "Coletivo",
    quarto: "Quarto",
  } as const;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Quarto</DialogTitle>
          <DialogDescription>Visualize as informações completas do quarto selecionado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bed className="h-4 w-4" />
                Número
              </div>
              <div className="text-base font-medium">{quarto.numero}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                Ala
              </div>
              <div className="text-base font-medium">{quarto.ala}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Capacidade
              </div>
              <div className="text-base font-medium">{quarto.capacidade}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Ocupação
              </div>
              <div className="text-base font-medium">{quarto.ocupacao_atual}/{quarto.capacidade}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Andar
              </div>
              <div className="text-base font-medium">{quarto.andar ? `${quarto.andar}º` : "-"}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                Tipo
              </div>
              <div className="text-base font-medium">{tipoLabel[quarto.tipo]}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Status
            </div>
            <Badge className={statusClasses[quarto.status]}>
              {quarto.status.charAt(0).toUpperCase() + quarto.status.slice(1)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Descrição
            </div>
            <div className="text-sm">{quarto.descricao || "-"}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Observações
            </div>
            <div className="text-sm">{quarto.observacoes || "-"}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Valor Mensal
            </div>
            <div className="text-sm">{quarto.valor_mensal ? `R$ ${quarto.valor_mensal.toFixed(2)}` : "-"}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

