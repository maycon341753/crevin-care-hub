import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, ClipboardList, Stethoscope, FlaskConical, Pill, NotebookPen, CheckSquare, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DateInput from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DocumentosMedicosUpload } from '@/components/documentos/DocumentosMedicosUpload';
import { DocumentosMedicosList } from '@/components/documentos/DocumentosMedicosList';
import { Idoso } from "@/types";

interface ProntuarioMedicoRecord {
  id?: string;
  idoso_id: string;
  identificacao_paciente?: string;
  anamnese?: string;
  // Campos específicos da anamnese
  queixa_principal?: string;
  historia_doenca_atual?: string;
  historia_medica_pregressa?: string;
  medicamentos_uso?: string;
  alergias?: string;
  historia_familiar?: string;
  historia_social?: string;
  revisao_sistemas?: string;
  exame_fisico?: string;
  hipoteses_diagnosticas?: string;
  diagnosticos_definitivos?: string;
  condutas_terapeuticas?: string;
  tratamentos?: string;
  prescricoes?: string;
  resultados_exames?: string;
  evolucoes_medicas?: string;
  evolucoes_outros_profissionais?: string;
  alta_informacoes?: string;
  alta_data?: string | null;
  status?: 'ativo' | 'inativo';
}

export default function ProntuarioMedico() {
  const { idosoId } = useParams<{ idosoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [idoso, setIdoso] = useState<Idoso | null>(null);
  const [prontuario, setProntuario] = useState<ProntuarioMedicoRecord>({
    idoso_id: idosoId || "",
    status: 'ativo',
  });
  const [refreshDocumentos, setRefreshDocumentos] = useState(0);

  useEffect(() => {
    if (idosoId) {
      fetchIdoso();
      fetchProntuario();
    }
  }, [idosoId]);

  const fetchIdoso = async () => {
    try {
      const { data, error } = await supabase
        .from('idosos')
        .select('*')
        .eq('id', idosoId)
        .single();

      if (error) throw error;
      setIdoso(data);
    } catch (error) {
      console.error('Erro ao carregar idoso:', error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados do idoso.", variant: "destructive" });
    }
  };

  const fetchProntuario = async () => {
    try {
      const { data, error } = await supabase
        .from('prontuario_medico')
        .select('*')
        .eq('idoso_id', idosoId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar prontuário médico:', error);
        return;
      }

      if (data) setProntuario(data);
    } catch (error) {
      console.error('Erro ao carregar prontuário médico:', error);
    }
  };

  const handleInputChange = (field: keyof ProntuarioMedicoRecord, value: any) => {
    setProntuario(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idosoId) return;
    setLoading(true);
    try {
      const payload = { 
        ...prontuario, 
        idoso_id: idosoId,
        // Garantir que data vazia seja enviada como null para coluna date
        alta_data: prontuario.alta_data ? prontuario.alta_data : null,
      };
      let result;
      if (prontuario.id) {
        result = await supabase.from('prontuario_medico').update(payload).eq('id', prontuario.id).select().single();
      } else {
        result = await supabase.from('prontuario_medico').insert(payload).select().single();
      }
      const { data, error } = result;
      if (error) throw error;
      setProntuario(data);
      toast({ title: "Salvo", description: "Prontuário médico atualizado com sucesso." });
    } catch (error) {
      console.error('Erro ao salvar prontuário médico:', error);
      toast({ title: "Erro", description: "Não foi possível salvar o prontuário médico.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!idoso) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/idosos")} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Prontuário Médico
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Paciente: <span className="font-semibold">{idoso.nome}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identificação do paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Identificação do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="identificacao_paciente">Identificação</Label>
                <Textarea id="identificacao_paciente" value={prontuario.identificacao_paciente || ''} onChange={(e) => handleInputChange('identificacao_paciente', e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Anamnese */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Anamnese</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="queixa_principal">Queixa Principal</Label>
                <Textarea 
                  id="queixa_principal" 
                  value={prontuario.queixa_principal || ''} 
                  onChange={(e) => handleInputChange('queixa_principal', e.target.value)} 
                  rows={3}
                  placeholder="Descreva a queixa principal do paciente..."
                />
              </div>
              
              <div>
                <Label htmlFor="historia_doenca_atual">História da Doença Atual</Label>
                <Textarea 
                  id="historia_doenca_atual" 
                  value={prontuario.historia_doenca_atual || ''} 
                  onChange={(e) => handleInputChange('historia_doenca_atual', e.target.value)} 
                  rows={4}
                  placeholder="Descreva a história da doença atual..."
                />
              </div>
              
              <div>
                <Label htmlFor="historia_medica_pregressa">História Médica Pregressa</Label>
                <Textarea 
                  id="historia_medica_pregressa" 
                  value={prontuario.historia_medica_pregressa || ''} 
                  onChange={(e) => handleInputChange('historia_medica_pregressa', e.target.value)} 
                  rows={3}
                  placeholder="Doenças anteriores, cirurgias, internações..."
                />
              </div>
              
              <div>
                <Label htmlFor="medicamentos_uso">Medicamentos em Uso</Label>
                <Textarea 
                  id="medicamentos_uso" 
                  value={prontuario.medicamentos_uso || ''} 
                  onChange={(e) => handleInputChange('medicamentos_uso', e.target.value)} 
                  rows={3}
                  placeholder="Liste os medicamentos em uso atual..."
                />
              </div>
              
              <div>
                <Label htmlFor="alergias">Alergias</Label>
                <Textarea 
                  id="alergias" 
                  value={prontuario.alergias || ''} 
                  onChange={(e) => handleInputChange('alergias', e.target.value)} 
                  rows={2}
                  placeholder="Alergias medicamentosas, alimentares ou outras..."
                />
              </div>
              
              <div>
                <Label htmlFor="historia_familiar">História Familiar</Label>
                <Textarea 
                  id="historia_familiar" 
                  value={prontuario.historia_familiar || ''} 
                  onChange={(e) => handleInputChange('historia_familiar', e.target.value)} 
                  rows={3}
                  placeholder="Histórico de doenças na família..."
                />
              </div>
              
              <div>
                <Label htmlFor="historia_social">História Social</Label>
                <Textarea 
                  id="historia_social" 
                  value={prontuario.historia_social || ''} 
                  onChange={(e) => handleInputChange('historia_social', e.target.value)} 
                  rows={3}
                  placeholder="Hábitos de vida, profissão, condições sociais..."
                />
              </div>
              
              <div>
                <Label htmlFor="revisao_sistemas">Revisão de Sistemas</Label>
                <Textarea 
                  id="revisao_sistemas" 
                  value={prontuario.revisao_sistemas || ''} 
                  onChange={(e) => handleInputChange('revisao_sistemas', e.target.value)} 
                  rows={4}
                  placeholder="Revisão por sistemas (cardiovascular, respiratório, digestivo, etc.)..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Exame físico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Exame Físico</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={prontuario.exame_fisico || ''} onChange={(e) => handleInputChange('exame_fisico', e.target.value)} rows={6} />
            </CardContent>
          </Card>

          {/* Hipóteses diagnósticas e diagnósticos definitivos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Hipóteses Diagnósticas e Diagnósticos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hipóteses Diagnósticas</Label>
                <Textarea value={prontuario.hipoteses_diagnosticas || ''} onChange={(e) => handleInputChange('hipoteses_diagnosticas', e.target.value)} rows={4} />
              </div>
              <div>
                <Label>Diagnósticos Definitivos</Label>
                <Textarea value={prontuario.diagnosticos_definitivos || ''} onChange={(e) => handleInputChange('diagnosticos_definitivos', e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Condutas terapêuticas, tratamentos e prescrições */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> Condutas, Tratamentos e Prescrições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Condutas Terapêuticas</Label>
                <Textarea value={prontuario.condutas_terapeuticas || ''} onChange={(e) => handleInputChange('condutas_terapeuticas', e.target.value)} rows={4} />
              </div>
              <div>
                <Label>Tratamentos</Label>
                <Textarea value={prontuario.tratamentos || ''} onChange={(e) => handleInputChange('tratamentos', e.target.value)} rows={4} />
              </div>
              <div>
                <Label>Prescrições</Label>
                <Textarea value={prontuario.prescricoes || ''} onChange={(e) => handleInputChange('prescricoes', e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Resultados de exames */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" /> Resultados de Exames</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={prontuario.resultados_exames || ''} onChange={(e) => handleInputChange('resultados_exames', e.target.value)} rows={6} />
            </CardContent>
          </Card>

          {/* Evoluções */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><NotebookPen className="h-5 w-5" /> Evoluções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Evoluções Médicas</Label>
                <Textarea value={prontuario.evolucoes_medicas || ''} onChange={(e) => handleInputChange('evolucoes_medicas', e.target.value)} rows={6} />
              </div>
              <div>
                <Label>Evoluções de Outros Profissionais</Label>
                <Textarea value={prontuario.evolucoes_outros_profissionais || ''} onChange={(e) => handleInputChange('evolucoes_outros_profissionais', e.target.value)} rows={6} />
              </div>
            </CardContent>
          </Card>

          {/* Alta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5" /> Alta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Informações da Alta</Label>
                <Textarea value={prontuario.alta_informacoes || ''} onChange={(e) => handleInputChange('alta_informacoes', e.target.value)} rows={4} />
              </div>
              <div>
                <Label>Data da Alta</Label>
                <DateInput
                  id="alta_data"
                  value={prontuario.alta_data || ''}
                  onChange={(value) => handleInputChange('alta_data', value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </CardContent>
          </Card>

          {/* Documentos Médicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Documentos Médicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <DocumentosMedicosUpload 
                 idosoId={idosoId!} 
                 onUploadSuccess={() => setRefreshDocumentos(prev => prev + 1)}
               />
               <DocumentosMedicosList 
                 idosoId={idosoId!} 
                 refreshTrigger={refreshDocumentos}
               />
             </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Prontuário'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}