import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PdfViewerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string | null;
  title?: string;
};

export default function PdfViewerModal({ isOpen, onClose, pdfUrl, title }: PdfViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title ?? "Visualizar PDF"}</DialogTitle>
        </DialogHeader>
        {pdfUrl ? (
          <div className="h-[70vh]">
            <iframe src={pdfUrl} className="w-full h-full" title="PDF" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Nenhum PDF disponível para esta licença.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}