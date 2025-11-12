import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateInput from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AddLicencaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddLicencaModal({ isOpen, onClose, onSuccess }: AddLicencaModalProps) {
  const [titulo, setTitulo] = useState("");
  const [emissor, setEmissor] = useState("");
  const [numero, setNumero] = useState("");
  const [dataEmissao, setDataEmissao] = useState<string | undefined>(undefined);
  const [dataValidade, setDataValidade] = useState<string | undefined>(undefined);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitulo("");
    setEmissor("");
    setNumero("");
    setDataEmissao(undefined);
    setDataValidade(undefined);
    setObservacoes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("Informe o título da licença");
      return;
    }

    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;

      const { error } = await supabase
        .from("licencas_funcionamento")
        .insert({
          titulo,
          emissor: emissor || null,
          numero: numero || null,
          data_emissao: dataEmissao || null,
          data_validade: dataValidade || null,
          observacoes: observacoes || null,
          created_by: userId,
        });

      if (error) throw error;

      toast.success("Licença criada com sucesso");
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao criar licença:", err);
      toast.error("Não foi possível criar a licença");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Licença de Funcionamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Licença Sanitária" />
            </div>
            <div>
              <Label>Emissor</Label>
              <Input value={emissor} onChange={(e) => setEmissor(e.target.value)} placeholder="Ex: Vigilância Sanitária" />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 12345-XYZ" />
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
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Notas adicionais" />
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