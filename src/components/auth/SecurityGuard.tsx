import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_EMAILS = [
  'walrezende@hotmail.com',
  'mayconreis@gmail.com',
  'desenvolvedor@crevin.com.br'
];

interface SecurityGuardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  storageKey?: string;
}

export function SecurityGuard({ 
  children, 
  title = "Acesso Protegido", 
  description = "Confirme sua senha para acessar este módulo.",
  storageKey = "security_unlocked"
}: SecurityGuardProps) {
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already unlocked in this session
    const unlocked = sessionStorage.getItem(storageKey);
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, [storageKey]);

  if (!user) return null;

  // 1. Check if user is allowed
  // Normalize emails to lowercase for comparison to avoid case sensitivity issues
  const userEmail = user.email?.toLowerCase() || '';
  const isAllowed = ALLOWED_EMAILS.some(email => email.toLowerCase() === userEmail);

  if (!isAllowed) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Você não tem permissão para acessar este módulo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Este módulo é restrito a usuários autorizados.<br/>
              Entre em contato com a administração se necessário.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Check if unlocked
  if (isUnlocked) {
    return <>{children}</>;
  }

  // 3. Prompt for password
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (error) throw error;

      // Success
      setIsUnlocked(true);
      sessionStorage.setItem(storageKey, 'true');
      toast({
        title: "Acesso liberado",
        description: "Acesso desbloqueado com sucesso.",
      });
    } catch (error) {
      console.error("Erro de autenticação:", error);
      toast({
        title: "Senha incorreta",
        description: "A senha informada não confere com o seu login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="bg-primary/5 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Lock className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password-check">Sua senha de login</Label>
              <Input
                id="password-check"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha..."
                className="focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Desbloquear Acesso"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Esta verificação é necessária para garantir a segurança dos dados.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
