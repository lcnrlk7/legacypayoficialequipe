"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Shield, User, Lock, XCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

// Credenciais únicas do CEO
const CEO_CREDENTIALS = {
  username: "elice",
  password: "Legacy@CEO2024!",
  name: "Elice",
  role: "CEO & Founder"
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (username.toLowerCase() === CEO_CREDENTIALS.username && password === CEO_CREDENTIALS.password) {
      // Salvar sessão do admin no localStorage
      localStorage.setItem("admin_session", JSON.stringify({
        authenticated: true,
        username: CEO_CREDENTIALS.username,
        name: CEO_CREDENTIALS.name,
        role: CEO_CREDENTIALS.role,
        loginAt: new Date().toISOString()
      }));
      
      router.push("/admin/ceo");
    } else {
      setError("Credenciais inválidas. Acesso restrito.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo e título */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <Image
              src="/logo-icon.png"
              alt="LegacyPay"
              width={48}
              height={48}
            />
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-white">Legacy</span>
              <span className="text-2xl font-bold text-primary">Pay</span>
            </div>
          </Link>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Painel do CEO
          </h1>
          <p className="text-muted-foreground">
            Área exclusiva de administração
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Usuário
              </label>
              <div className="relative">
                <User className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="pl-12 h-12 bg-secondary border-border"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-12 pr-12 h-12 bg-secondary border-border"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {error}
                </p>
              </motion.div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Acessar Painel
                </>
              )}
            </Button>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 opacity-50 mt-0.5 flex-shrink-0" />
              <p>
                Este é um acesso restrito e monitorado. Todas as atividades são registradas por motivos de segurança.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/" className="text-primary hover:underline">
            Voltar ao site
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
