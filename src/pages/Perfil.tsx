import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Users, Mail, Shield, Phone, MapPin, Calendar, FileText, CreditCard } from "lucide-react";
import { formatCPF, formatPhone, formatBrazilianDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Perfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [source, setSource] = useState<'funcionarios' | 'profiles' | 'auth'>('auth');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // 1. Tentar buscar na tabela funcionarios pelo email
        // Assumindo que o email do usuário logado é o mesmo do funcionário cadastrado
        if (user.email) {
          const { data: funcData, error: funcError } = await supabase
            .from('funcionarios')
            .select('*, departamentos(nome)')
            .eq('email', user.email)
            .maybeSingle();
            
          if (funcData) {
            setProfileData(funcData);
            setSource('funcionarios');
            setLoading(false);
            return;
          }
        }

        // 2. Se não achou em funcionarios, buscar em profiles pelo user_id
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profData) {
          setProfileData(profData);
          setSource('profiles');
        } else {
            // 3. Fallback para dados básicos do Auth
            setProfileData({
                nome: user.user_metadata?.full_name || 'Usuário',
                email: user.email,
                role: 'Usuário'
            });
            setSource('auth');
        }

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const renderField = (label: string, value: string | null | undefined, icon?: React.ReactNode, fullWidth = false) => (
    <div className={`space-y-1.5 ${fullWidth ? 'col-span-full' : ''}`}>
      <Label className="text-muted-foreground text-xs flex items-center gap-1.5 font-medium uppercase tracking-wider">
        {icon && <span className="h-3.5 w-3.5">{icon}</span>}
        {label}
      </Label>
      <div className="relative">
        <Input 
          value={value || "Não informado"} 
          readOnly 
          disabled 
          className="bg-muted/30 font-medium text-foreground border-muted-foreground/20 cursor-not-allowed focus-visible:ring-0" 
        />
      </div>
    </div>
  );

  // Determinar nome a ser exibido
  const displayName = source === 'funcionarios' ? profileData.nome : (profileData.full_name || profileData.nome);
  const displayRole = source === 'funcionarios' ? profileData.cargo : (profileData.role || 'Usuário');

  return (
    <div className="container mx-auto py-8 max-w-4xl animate-in fade-in duration-500 space-y-8">
      
      {/* Cabeçalho do Perfil */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-card p-6 rounded-xl border shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(displayName)}
            </AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left space-y-2 flex-1">
            <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    {displayRole}
                </Badge>
                {source === 'funcionarios' && (
                    <Badge variant="outline" className={profileData.status === 'ativo' ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500'}>
                        {profileData.status?.toUpperCase() || 'ATIVO'}
                    </Badge>
                )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                <Mail className="w-3 h-3" /> {profileData.email}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal - Informações Pessoais */}
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-primary" />
                        Informações Pessoais
                    </CardTitle>
                    <CardDescription>Dados cadastrais básicos do usuário</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderField("Nome Completo", displayName, null, true)}
                    
                    {source === 'funcionarios' ? (
                        <>
                            {renderField("CPF", formatCPF(profileData.cpf || ''), <FileText />)}
                            {renderField("RG", profileData.rg, <FileText />)}
                            {renderField("Data de Nascimento", formatBrazilianDate(profileData.data_nascimento), <Calendar />)}
                            {renderField("Telefone", formatPhone(profileData.telefone || ''), <Phone />)}
                            {renderField("Endereço", profileData.endereco, <MapPin />, true)}
                        </>
                    ) : (
                        <div className="col-span-full py-4 text-center text-muted-foreground text-sm bg-muted/20 rounded-lg border border-dashed">
                            Informações detalhadas disponíveis apenas para funcionários cadastrados.
                        </div>
                    )}
                </CardContent>
            </Card>

            {source === 'funcionarios' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5 text-primary" />
                            Dados Funcionais
                        </CardTitle>
                        <CardDescription>Informações sobre cargo e departamento</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderField("Cargo", profileData.cargo, <Shield />)}
                        {renderField("Departamento", profileData.departamentos?.nome, <Users />)}
                        {renderField("Data de Admissão", formatBrazilianDate(profileData.data_admissao), <Calendar />)}
                        {renderField("Salário Base", "R$ *****", <CreditCard />)} {/* Ocultando salário por privacidade */}
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Coluna Lateral - Segurança e Sistema */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Acesso ao Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderField("Email de Login", user?.email, <Mail />)}
                    {renderField("Último Acesso", user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'N/A', <Calendar />)}
                    {renderField("ID do Usuário", user?.id, <Shield />)}
                    
                    <Separator className="my-4" />
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs text-yellow-800">
                        <p className="font-semibold mb-1">Modo Somente Leitura</p>
                        Para alterar suas informações pessoais, entre em contato com o administrador do sistema ou o departamento de RH.
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
