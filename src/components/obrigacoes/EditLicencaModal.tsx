import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateInput from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type LicencaFuncionamento = {
  id: string;
  titulo: string;
  emissor?: string | null;
  numero?: string | null;
  data_emissao?: string | null;
  data_validade?: string | null;
  observacoes?: string | null;
};

type EditLicencaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  licenca: LicencaFuncionamento | null;
};

export default function EditLicencaModal({ isOpen, onClose, onSuccess, licenca }: EditLicencaModalProps) {
  const [titulo, setTitulo] = useState(licenca?.titulo ?? "");
  const [emissor, setEmissor] = useState(licenca?.emissor ?? "");
  const [numero, setNumero] = useState(licenca?.numero ?? "");
  const [dataEmissao, setDataEmissao] = useState<string | undefined>(licenca?.data_emissao ?? undefined);
  const [dataValidade, setDataValidade] = useState<string | undefined>(licenca?.data_validade ?? undefined);
  const [observacoes, setObservacoes] = useState(licenca?.observacoes ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitulo(licenca?.titulo ?? "");
    setEmissor(licenca?.emissor ?? "");
    setNumero(licenca?.numero ?? "");
    setDataEmissao(licenca?.data_emissao ?? undefined);
    setDataValidade(licenca?.data_validade ?? undefined);
    setObservacoes(licenca?.observacoes ?? "");
  }, [licenca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenca) return;
    if (!titulo.trim()) {
      toast.error("Informe o título da licença");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("licencas_funcionamento")
        .update({
          titulo,
          emissor: emissor || null,
          numero: numero || null,
          data_emissao: dataEmissao || null,
          data_validade: dataValidade || null,
          observacoes: observacoes || null,
        })
        .eq("id", licenca.id);

      if (error) throw error;

      toast.success("Licença atualizada com sucesso");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao atualizar licença:", err);
      const msg = err?.message?.toString?.() ?? "";
      if (msg.toLowerCase().includes("row-level security")) {
        toast.error("Você não tem permissão para editar esta licença (RLS)");
      } else {
        toast.error("Não foi possível atualizar a licença");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Licença</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div>
              <Label>Emissor</Label>
              <Input value={emissor ?? ""} onChange={(e) => setEmissor(e.target.value)} />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={numero ?? ""} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div>
              <Label>Data de Emissão</Label>
              <DateInput value={dataEmissao} onChange={setDataEmissao} />
            </div>
            <div>
              <Label>Validade</Label>
              <DateInput value={dataValidade} onChange={setDataValidade} />
            </div>
            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea value={observacoes ?? ""} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}