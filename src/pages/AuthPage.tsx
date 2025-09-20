import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {isLogin ? (
          <LoginForm onToggleForm={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleForm={() => setIsLogin(true)} />
        )}
      </div>
      
      {/* Footer info */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="text-white/80 text-sm">
          <p className="font-medium">CREVIN - Comunidade de Renovação Esperança e Vida Nova</p>
          <p className="text-xs mt-1">CNPJ: 01.600.253/0001-69 | Brasília-DF</p>
        </div>
      </div>
    </div>
  );
}