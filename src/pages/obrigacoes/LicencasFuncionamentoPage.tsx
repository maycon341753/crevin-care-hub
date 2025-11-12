import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload, Eye } from "lucide-react";
import AddLicencaModal from "@/components/obrigacoes/AddLicencaModal";
import PdfViewerModal from "@/components/obrigacoes/PdfViewerModal";

type LicencaFuncionamento = {
  id: string;
  titulo: string;
  emissor?: string | null;
  numero?: string | null;
  data_emissao?: string | null;
  data_validade?: string | null;
  arquivo_url?: string | null;
  arquivo_storage_path?: string | null;
  observacoes?: string | null;
};

function formatDate(date?: string | null) {
  if (!date) return "-";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return date;
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

export default function LicencasFuncionamentoPage() {
  const [licencas, setLicencas] = useState<LicencaFuncionamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>("Visualizar PDF");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchLicencas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("licencas_funcionamento")
        .select("*")
        .order("data_validade", { ascending: true });
      if (error) throw error;
      setLicencas(data ?? []);
    } catch (err) {
      console.error("Erro ao carregar licenças:", err);
      const code = (err as any)?.code ?? null;
      setErrorCode(code);
      if (code === "PGRST205") {
        toast.error("Tabela 'licencas_funcionamento' não encontrada. Aplique a migration.");
      } else {
        toast.error("Erro ao carregar licenças de funcionamento");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicencas();
  }, []);

  const filtered = licencas.filter((l) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      l.titulo.toLowerCase().includes(s) ||
      (l.emissor ?? "").toLowerCase().includes(s) ||
      (l.numero ?? "").toLowerCase().includes(s)
    );
  });

  const triggerUpload = (id: string) => {
    setUploadingId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF");
      return;
    }

    if (!uploadingId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? "anon";
      const bucket = "licencas"; // certifique-se que o bucket existe no Supabase Storage
      const path = `${userId}/${uploadingId}.pdf`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = pub?.publicUrl ?? null;

      const { error: updErr } = await supabase
        .from("licencas_funcionamento")
        .update({ arquivo_url: publicUrl, arquivo_storage_path: path })
        .eq("id", uploadingId);
      if (updErr) throw updErr;

      toast.success("PDF enviado com sucesso");
      fetchLicencas();
    } catch (err) {
      console.error("Erro ao enviar PDF:", err);
      const msg = (err as any)?.message?.toString?.() ?? "";
      if (msg.includes("Bucket not found")) {
        toast.error("Bucket 'licencas' não encontrado. Aplique a migration crevin-care-hub/supabase/migrations/20251112090500_create_storage_bucket_licencas.sql.");
      } else if (
        msg.includes("row-level security policy") ||
        msg.toLowerCase().includes("rls") ||
        msg.toLowerCase().includes("violates row-level security")
      ) {
        toast.error(
          "Upload bloqueado por RLS no Storage. Crie uma política de INSERT para o bucket 'licencas' permitindo usuários autenticados."
        );
        console.warn(
          "Dica de política SQL:",
          "CREATE POLICY licencas_insert_auth ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'licencas');"
        );
      } else {
        toast.error("Falha no upload. Verifique se o bucket 'licencas' existe.");
      }
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openPdf = (l: LicencaFuncionamento) => {
    setPdfUrl(l.arquivo_url ?? null);
    setPdfTitle(l.titulo);
    setShowPdf(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Licenças de Funcionamento</h1>
          <p className="text-muted-foreground">Gerencie licenças no módulo Obrigações</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Licença
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por título, emissor ou número"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licenças</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Carregando...</div>
          ) : errorCode === "PGRST205" ? (
            <div className="text-sm">
              <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive mb-3">
                Tabela <code>public.licencas_funcionamento</code> não existe.
              </div>
              <div className="text-muted-foreground">
                Aplique a migration em <code>supabase/migrations/20251112090000_create_licencas_funcionamento.sql</code>
                pelo SQL Editor do Supabase ou via CLI (<code>supabase db push</code>), e garanta o bucket
                <code>licencas</code> no Storage.
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Emissor</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => {
                  const s = calcStatus(l.data_validade);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.titulo}</TableCell>
                      <TableCell>{l.emissor ?? "-"}</TableCell>
                      <TableCell>{l.numero ?? "-"}</TableCell>
                      <TableCell>{formatDate(l.data_emissao)}</TableCell>
                      <TableCell>{formatDate(l.data_validade)}</TableCell>
                      <TableCell>
                        <Badge variant={s.variant as any}>{s.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => triggerUpload(l.id)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF
                          </Button>
                          <Button variant="outline" onClick={() => openPdf(l)} disabled={!l.arquivo_url}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma licença encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <AddLicencaModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchLicencas} />
      <PdfViewerModal isOpen={showPdf} onClose={() => setShowPdf(false)} pdfUrl={pdfUrl} title={pdfTitle} />
    </div>
  );
}