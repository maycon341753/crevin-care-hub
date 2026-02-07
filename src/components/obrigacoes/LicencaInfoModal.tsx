import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type LicencaFuncionamento = {
  id: string;
  titulo: string;
  emissor?: string | null;
  numero?: string | null;
  data_emissao?: string | null;
  data_validade?: string | null;
  arquivo_url?: string | null;
  observacoes?: string | null;
};

type LicencaInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  licenca: LicencaFuncionamento | null;
};

function formatDate(date?: string | null) {
  if (!date) return "-";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return date ?? "-";
  }
}

function calcStatus(validade?: string | null) {
  if (!validade) return { label: "Sem validade", variant: "outline" as const };
  const today = new Date();
  const d = new Date(validade);
  if (isNaN(d.getTime())) return { label: "Data inválida", variant: "destructive" as const };
  if (d < today) return { label: "Expirada", variant: "destructive" as const };
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) return { label: `Vence em ${diffDays}d`, variant: "secondary" as const };
  return { label: "Válida", variant: "default" as const };
}

export default function LicencaInfoModal({ isOpen, onClose, licenca }: LicencaInfoModalProps) {
  const s = calcStatus(licenca?.data_validade);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes da Licença</DialogTitle>
        </DialogHeader>
        {licenca ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Título</div>
                <div className="text-base font-medium">{licenca.titulo}</div>
              </div>
              <Badge variant={s.variant as any}>{s.label}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Emissor</div>
                <div>{licenca.emissor ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Número</div>
                <div>{licenca.numero ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Data de Emissão</div>
                <div>{formatDate(licenca.data_emissao)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Validade</div>
                <div>{formatDate(licenca.data_validade)}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Observações</div>
              <div className="whitespace-pre-wrap">{licenca.observacoes ?? "-"}</div>
            </div>
            {licenca.arquivo_url ? (
              <div>
                <a href={licenca.arquivo_url} target="_blank" rel="noreferrer" className="text-primary underline">
                  Abrir PDF
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-muted-foreground">Nenhuma licença selecionada</div>
        )}
      </DialogContent>
    </Dialog>
  );
}