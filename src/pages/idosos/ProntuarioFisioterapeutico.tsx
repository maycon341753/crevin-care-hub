import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, FileText, Activity, Stethoscope, Target, Zap, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface ProntuarioFisioterapeuticoRecord {
  id?: string;
  idoso_id: string;
  nome?: string;
  data_nascimento?: string;
  telefone?: string;
  sexo?: 'masculino' | 'feminino' | 'outro';
  profissao?: string;
  endereco_residencial?: string;
  naturalidade?: string;
  estado_civil?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel';
  diagnostico_clinico?: string;
  diagnostico_fisioterapeutico?: string;
  historia_clinica?: string;
  queixa_principal?: string;
  historia_doenca_atual?: string;
  historia_doenca_pregressa?: string;
  habitos_vida?: string;
  antecedentes_pessoais?: string;
  antecedentes_familiares?: string;
  tratamentos_realizados?: string;
  cirurgias_anteriores?: string;
  apresentacao_deambulando?: boolean;
  apresentacao_internado?: boolean;
  apresentacao_cadeira_rodas?: boolean;
  apresentacao_deambulando_apoio?: boolean;
  apresentacao_orientado?: boolean;
  exames_complementares?: boolean;
  exames_complementares_detalhes?: string;
  usa_medicamentos?: boolean;
  medicamentos_detalhes?: string;
  realizou_cirurgia?: boolean;
  cirurgias_detalhes?: string;
  inspecao_normal?: boolean;
  inspecao_edema?: boolean;
  inspecao_cicatrizacao_incompleta?: boolean;
  inspecao_eritemas?: boolean;
  inspecao_outros?: string;
  semiologia?: string;
  testes_especificos?: string;
  eva_dor?: number;
  plano_terapeutico?: string;
  objetivos_tratamento?: string;
  recursos_terapeuticos?: string;
  plano_tratamento?: string;
  evolucao?: string;
  status?: 'ativo' | 'inativo' | 'finalizado';
}

interface Idoso {
  id: string;
  nome: string;
  data_nascimento?: string;
  telefone?: string;
  quarto?: string;
}

export default function ProntuarioFisioterapeutico() {
  const { idosoId } = useParams<{ idosoId: string }>();
  const navigate = useNavigate();
  const [idoso, setIdoso] = useState<Idoso | null>(null);
  const [prontuario, setProntuario] = useState<ProntuarioFisioterapeuticoRecord>({
    idoso_id: idosoId || '',
    sexo: 'masculino',
    estado_civil: 'solteiro',
    apresentacao_deambulando: false,
    apresentacao_internado: false,
    apresentacao_cadeira_rodas: false,
    apresentacao_deambulando_apoio: false,
    apresentacao_orientado: false,
    exames_complementares: false,
    usa_medicamentos: false,
    realizou_cirurgia: false,
    inspecao_normal: false,
    inspecao_edema: false,
    inspecao_cicatrizacao_incompleta: false,
    inspecao_eritemas: false,
    eva_dor: 0,
    status: 'ativo'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        .select('id, nome, data_nascimento, telefone, quarto')
        .eq('id', idosoId)
        .single();

      if (error) throw error;
      setIdoso(data);
      
      // Preencher dados básicos do prontuário com dados do idoso
      setProntuario(prev => ({
        ...prev,
        nome: data.nome,
        data_nascimento: data.data_nascimento,
        telefone: data.telefone
      }));
    } catch (error) {
      console.error('Erro ao buscar idoso:', error);
      toast.error('Erro ao carregar dados do idoso');
    }
  };

  const fetchProntuario = async () => {
    try {
      const { data, error } = await supabase
        .from('prontuario_fisioterapeutico')
        .select('*')
        .eq('idoso_id', idosoId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setProntuario(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar prontuário:', error);
      toast.error('Erro ao carregar prontuário fisioterapêutico');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProntuarioFisioterapeuticoRecord, value: any) => {
    setProntuario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: keyof ProntuarioFisioterapeuticoRecord, checked: boolean) => {
    setProntuario(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('prontuario_fisioterapeutico')
        .upsert(prontuario);

      if (error) throw error;

      toast.success('Prontuário fisioterapêutico salvo com sucesso!');
      navigate('/idosos');
    } catch (error) {
      console.error('Erro ao salvar prontuário:', error);
      toast.error('Erro ao salvar prontuário fisioterapêutico');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              <Activity className="h-8 w-8" />
              Avaliação Fisioterapêutica
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Paciente: <span className="font-semibold">{idoso.nome}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. IDENTIFICAÇÃO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                1. IDENTIFICAÇÃO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={prontuario.nome || ''}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={prontuario.data_nascimento || ''}
                    onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={prontuario.telefone || ''}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select value={prontuario.sexo} onValueChange={(value) => handleInputChange('sexo', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="profissao">Profissão</Label>
                  <Input
                    id="profissao"
                    value={prontuario.profissao || ''}
                    onChange={(e) => handleInputChange('profissao', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="estado_civil">Estado Civil</Label>
                  <Select value={prontuario.estado_civil} onValueChange={(value) => handleInputChange('estado_civil', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="casado">Casado(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      <SelectItem value="uniao_estavel">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="endereco_residencial">Endereço Residencial</Label>
                <Textarea
                  id="endereco_residencial"
                  value={prontuario.endereco_residencial || ''}
                  onChange={(e) => handleInputChange('endereco_residencial', e.target.value)}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="naturalidade">Naturalidade</Label>
                <Input
                  id="naturalidade"
                  value={prontuario.naturalidade || ''}
                  onChange={(e) => handleInputChange('naturalidade', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="diagnostico_clinico">Diagnóstico Clínico</Label>
                <Textarea
                  id="diagnostico_clinico"
                  value={prontuario.diagnostico_clinico || ''}
                  onChange={(e) => handleInputChange('diagnostico_clinico', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="diagnostico_fisioterapeutico">Diagnóstico Fisioterapêutico</Label>
                <Textarea
                  id="diagnostico_fisioterapeutico"
                  value={prontuario.diagnostico_fisioterapeutico || ''}
                  onChange={(e) => handleInputChange('diagnostico_fisioterapeutico', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. AVALIAÇÃO - História Clínica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                2. AVALIAÇÃO - História Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="historia_clinica">História Clínica</Label>
                <Textarea
                  id="historia_clinica"
                  value={prontuario.historia_clinica || ''}
                  onChange={(e) => handleInputChange('historia_clinica', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="queixa_principal">Queixa Principal do Paciente (QP)</Label>
                <Textarea
                  id="queixa_principal"
                  value={prontuario.queixa_principal || ''}
                  onChange={(e) => handleInputChange('queixa_principal', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="historia_doenca_atual">História da Doença Atual (HDA)</Label>
                <Textarea
                  id="historia_doenca_atual"
                  value={prontuario.historia_doenca_atual || ''}
                  onChange={(e) => handleInputChange('historia_doenca_atual', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="historia_doenca_pregressa">História da Doença Pregressa (HDP)</Label>
                <Textarea
                  id="historia_doenca_pregressa"
                  value={prontuario.historia_doenca_pregressa || ''}
                  onChange={(e) => handleInputChange('historia_doenca_pregressa', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="habitos_vida">Hábitos de Vida</Label>
                <Textarea
                  id="habitos_vida"
                  value={prontuario.habitos_vida || ''}
                  onChange={(e) => handleInputChange('habitos_vida', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="antecedentes_pessoais">Antecedentes Pessoais</Label>
                <Textarea
                  id="antecedentes_pessoais"
                  value={prontuario.antecedentes_pessoais || ''}
                  onChange={(e) => handleInputChange('antecedentes_pessoais', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="antecedentes_familiares">Antecedentes Familiares</Label>
                <Textarea
                  id="antecedentes_familiares"
                  value={prontuario.antecedentes_familiares || ''}
                  onChange={(e) => handleInputChange('antecedentes_familiares', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="tratamentos_realizados">Tratamentos Realizados</Label>
                <Textarea
                  id="tratamentos_realizados"
                  value={prontuario.tratamentos_realizados || ''}
                  onChange={(e) => handleInputChange('tratamentos_realizados', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="cirurgias_anteriores">Cirurgias Anteriores</Label>
                <Textarea
                  id="cirurgias_anteriores"
                  value={prontuario.cirurgias_anteriores || ''}
                  onChange={(e) => handleInputChange('cirurgias_anteriores', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* EXAME CLÍNICO/FÍSICO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                EXAME CLÍNICO/FÍSICO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Apresentação do Paciente */}
              <div>
                <Label className="text-base font-medium mb-3 block">APRESENTAÇÃO DO PACIENTE:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apresentacao_deambulando"
                      checked={prontuario.apresentacao_deambulando}
                      onCheckedChange={(checked) => handleCheckboxChange('apresentacao_deambulando', checked as boolean)}
                    />
                    <Label htmlFor="apresentacao_deambulando">Deambulando</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apresentacao_internado"
                      checked={prontuario.apresentacao_internado}
                      onCheckedChange={(checked) => handleCheckboxChange('apresentacao_internado', checked as boolean)}
                    />
                    <Label htmlFor="apresentacao_internado">Internado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apresentacao_cadeira_rodas"
                      checked={prontuario.apresentacao_cadeira_rodas}
                      onCheckedChange={(checked) => handleCheckboxChange('apresentacao_cadeira_rodas', checked as boolean)}
                    />
                    <Label htmlFor="apresentacao_cadeira_rodas">Cadeira de rodas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apresentacao_deambulando_apoio"
                      checked={prontuario.apresentacao_deambulando_apoio}
                      onCheckedChange={(checked) => handleCheckboxChange('apresentacao_deambulando_apoio', checked as boolean)}
                    />
                    <Label htmlFor="apresentacao_deambulando_apoio">Deambulando com apoio/auxílio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apresentacao_orientado"
                      checked={prontuario.apresentacao_orientado}
                      onCheckedChange={(checked) => handleCheckboxChange('apresentacao_orientado', checked as boolean)}
                    />
                    <Label htmlFor="apresentacao_orientado">Orientado</Label>
                  </div>
                </div>
              </div>

              {/* Exames Complementares */}
              <div>
                <Label className="text-base font-medium mb-3 block">EXAMES COMPLEMENTARES:</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="exames_complementares_sim"
                        checked={prontuario.exames_complementares}
                        onCheckedChange={(checked) => handleCheckboxChange('exames_complementares', checked as boolean)}
                      />
                      <Label htmlFor="exames_complementares_sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="exames_complementares_nao"
                        checked={!prontuario.exames_complementares}
                        onCheckedChange={(checked) => handleCheckboxChange('exames_complementares', !checked as boolean)}
                      />
                      <Label htmlFor="exames_complementares_nao">Não</Label>
                    </div>
                  </div>
                  {prontuario.exames_complementares && (
                    <div>
                      <Label htmlFor="exames_complementares_detalhes">Se sim, quais?</Label>
                      <Textarea
                        id="exames_complementares_detalhes"
                        value={prontuario.exames_complementares_detalhes || ''}
                        onChange={(e) => handleInputChange('exames_complementares_detalhes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Medicamentos */}
              <div>
                <Label className="text-base font-medium mb-3 block">USA MEDICAMENTOS:</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="usa_medicamentos_sim"
                        checked={prontuario.usa_medicamentos}
                        onCheckedChange={(checked) => handleCheckboxChange('usa_medicamentos', checked as boolean)}
                      />
                      <Label htmlFor="usa_medicamentos_sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="usa_medicamentos_nao"
                        checked={!prontuario.usa_medicamentos}
                        onCheckedChange={(checked) => handleCheckboxChange('usa_medicamentos', !checked as boolean)}
                      />
                      <Label htmlFor="usa_medicamentos_nao">Não</Label>
                    </div>
                  </div>
                  {prontuario.usa_medicamentos && (
                    <div>
                      <Label htmlFor="medicamentos_detalhes">Se sim, quais?</Label>
                      <Textarea
                        id="medicamentos_detalhes"
                        value={prontuario.medicamentos_detalhes || ''}
                        onChange={(e) => handleInputChange('medicamentos_detalhes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Cirurgias */}
              <div>
                <Label className="text-base font-medium mb-3 block">REALIZOU CIRURGIA:</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="realizou_cirurgia_sim"
                        checked={prontuario.realizou_cirurgia}
                        onCheckedChange={(checked) => handleCheckboxChange('realizou_cirurgia', checked as boolean)}
                      />
                      <Label htmlFor="realizou_cirurgia_sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="realizou_cirurgia_nao"
                        checked={!prontuario.realizou_cirurgia}
                        onCheckedChange={(checked) => handleCheckboxChange('realizou_cirurgia', !checked as boolean)}
                      />
                      <Label htmlFor="realizou_cirurgia_nao">Não</Label>
                    </div>
                  </div>
                  {prontuario.realizou_cirurgia && (
                    <div>
                      <Label htmlFor="cirurgias_detalhes">Se sim, quais?</Label>
                      <Textarea
                        id="cirurgias_detalhes"
                        value={prontuario.cirurgias_detalhes || ''}
                        onChange={(e) => handleInputChange('cirurgias_detalhes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Inspeção/Palpação */}
              <div>
                <Label className="text-base font-medium mb-3 block">INSPEÇÃO/PALPAÇÃO:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inspecao_normal"
                      checked={prontuario.inspecao_normal}
                      onCheckedChange={(checked) => handleCheckboxChange('inspecao_normal', checked as boolean)}
                    />
                    <Label htmlFor="inspecao_normal">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inspecao_edema"
                      checked={prontuario.inspecao_edema}
                      onCheckedChange={(checked) => handleCheckboxChange('inspecao_edema', checked as boolean)}
                    />
                    <Label htmlFor="inspecao_edema">Edema</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inspecao_cicatrizacao_incompleta"
                      checked={prontuario.inspecao_cicatrizacao_incompleta}
                      onCheckedChange={(checked) => handleCheckboxChange('inspecao_cicatrizacao_incompleta', checked as boolean)}
                    />
                    <Label htmlFor="inspecao_cicatrizacao_incompleta">Cicatrização incompleta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inspecao_eritemas"
                      checked={prontuario.inspecao_eritemas}
                      onCheckedChange={(checked) => handleCheckboxChange('inspecao_eritemas', checked as boolean)}
                    />
                    <Label htmlFor="inspecao_eritemas">Eritemas</Label>
                  </div>
                </div>
                <div className="mt-3">
                  <Label htmlFor="inspecao_outros">Outros</Label>
                  <Textarea
                    id="inspecao_outros"
                    value={prontuario.inspecao_outros || ''}
                    onChange={(e) => handleInputChange('inspecao_outros', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Semiologia e Testes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                SEMIOLOGIA E TESTES ESPECÍFICOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="semiologia">SEMIOLOGIA</Label>
                <Textarea
                  id="semiologia"
                  value={prontuario.semiologia || ''}
                  onChange={(e) => handleInputChange('semiologia', e.target.value)}
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="testes_especificos">TESTES ESPECÍFICOS</Label>
                <Textarea
                  id="testes_especificos"
                  value={prontuario.testes_especificos || ''}
                  onChange={(e) => handleInputChange('testes_especificos', e.target.value)}
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="eva_dor">AVALIAÇÃO DA INTENSIDADE DA DOR - Escala Visual Analógica (EVA) - 0 a 10</Label>
                <Input
                  id="eva_dor"
                  type="number"
                  min="0"
                  max="10"
                  value={prontuario.eva_dor || 0}
                  onChange={(e) => handleInputChange('eva_dor', parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  0 = Sem dor | 10 = Dor insuportável
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plano Terapêutico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                PLANO TERAPÊUTICO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="plano_terapeutico">PLANO TERAPÊUTICO</Label>
                <Textarea
                  id="plano_terapeutico"
                  value={prontuario.plano_terapeutico || ''}
                  onChange={(e) => handleInputChange('plano_terapeutico', e.target.value)}
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="objetivos_tratamento">OBJETIVOS DE TRATAMENTO</Label>
                <Textarea
                  id="objetivos_tratamento"
                  value={prontuario.objetivos_tratamento || ''}
                  onChange={(e) => handleInputChange('objetivos_tratamento', e.target.value)}
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="recursos_terapeuticos">RECURSOS TERAPÊUTICOS</Label>
                <Textarea
                  id="recursos_terapeuticos"
                  value={prontuario.recursos_terapeuticos || ''}
                  onChange={(e) => handleInputChange('recursos_terapeuticos', e.target.value)}
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="plano_tratamento">PLANO DE TRATAMENTO</Label>
                <Textarea
                  id="plano_tratamento"
                  value={prontuario.plano_tratamento || ''}
                  onChange={(e) => handleInputChange('plano_tratamento', e.target.value)}
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Evolução */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                EVOLUÇÃO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="evolucao">
                  EVOLUÇÃO (descrever na evolução estado do paciente, conduta de saúde aplicada, resultados obtidos e eventuais intercorrências)
                </Label>
                <Textarea
                  id="evolucao"
                  value={prontuario.evolucao || ''}
                  onChange={(e) => handleInputChange('evolucao', e.target.value)}
                  rows={8}
                  placeholder="Descreva aqui a evolução do paciente, incluindo estado atual, condutas aplicadas, resultados obtidos e eventuais intercorrências..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/idosos')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Salvando...' : 'Salvar Avaliação Fisioterapêutica'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}