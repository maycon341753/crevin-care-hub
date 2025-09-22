import { LoginForm } from "@/components/auth/LoginForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
        
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2025 CREVIN - Comunidade de Renovação Esperança e Vida Nova</p>
          <p>Sistema Administrativo Interno</p>
        </footer>
      </div>
    </div>
  );
}