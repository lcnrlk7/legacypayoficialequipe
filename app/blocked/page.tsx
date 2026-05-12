"use client";

import { useEffect, useState } from "react";
import { ShieldX, Skull, Ban, AlertTriangle } from "lucide-react";

export default function BlockedPage() {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,0,0,0.1)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.05%22/%3E%3C/svg%3E')] opacity-50" />
      
      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]" />
      </div>

      {/* Main content */}
      <div className={`relative z-10 text-center max-w-2xl mx-auto ${glitch ? "animate-pulse" : ""}`}>
        {/* Icon */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/50 animate-pulse">
            <ShieldX className="w-16 h-16 text-red-500" />
          </div>
          <Skull className="absolute -top-2 -right-2 w-8 h-8 text-red-400 animate-bounce" />
          <Ban className="absolute -bottom-2 -left-2 w-8 h-8 text-red-400 animate-bounce" style={{ animationDelay: "0.5s" }} />
        </div>

        {/* Title with glitch effect */}
        <h1 className={`text-5xl md:text-7xl font-black mb-6 ${glitch ? "text-red-500" : "text-white"}`}>
          <span className={glitch ? "relative" : ""}>
            {glitch && (
              <>
                <span className="absolute -left-1 text-cyan-500 opacity-70">ACESSO NEGADO</span>
                <span className="absolute left-1 text-red-500 opacity-70">ACESSO NEGADO</span>
              </>
            )}
            ACESSO NEGADO
          </span>
        </h1>

        {/* Subtitle */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
          <p className="text-xl text-red-400 font-bold mb-2">
            Seu IP foi permanentemente bloqueado
          </p>
          <p className="text-gray-400">
            Tentou ser espertinho? Nao deu certo, ne?
          </p>
        </div>

        {/* Mocking messages */}
        <div className="space-y-4 mb-8">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-left">
            <code className="text-green-400 text-sm font-mono">
              <span className="text-gray-500">[SISTEMA]</span> Tentativa de ataque detectada e registrada
            </code>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-left">
            <code className="text-green-400 text-sm font-mono">
              <span className="text-gray-500">[SISTEMA]</span> XSS? Serio? Estamos em 2026, amigo...
            </code>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-left">
            <code className="text-green-400 text-sm font-mono">
              <span className="text-gray-500">[SISTEMA]</span> Seus dados foram logados. Boa sorte!
            </code>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-left">
            <code className="text-yellow-400 text-sm font-mono">
              <span className="text-gray-500">[AVISO]</span> Proxima vez tenta um curso de programacao primeiro
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="text-gray-600 text-sm">
          <p>Erro 403 - Acesso Permanentemente Negado</p>
          <p className="mt-2 text-xs">
            IP registrado e reportado aos orgaos competentes
          </p>
        </div>

        {/* Fake terminal */}
        <div className="mt-8 bg-black border border-red-500/30 rounded-lg p-4 text-left font-mono text-xs">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-500 ml-2">security_log.sh</span>
          </div>
          <div className="space-y-1 text-green-400">
            <p><span className="text-red-400">$</span> analyzing_attack_vector...</p>
            <p><span className="text-red-400">$</span> attack_type: XSS_INJECTION</p>
            <p><span className="text-red-400">$</span> threat_level: PATHETIC</p>
            <p><span className="text-red-400">$</span> attacker_skill: SCRIPT_KIDDIE</p>
            <p><span className="text-red-400">$</span> response: IP_BLOCKED_PERMANENTLY</p>
            <p><span className="text-red-400">$</span> message: &quot;Volta pro YouTube estudar, amigao&quot;</p>
            <p className="animate-pulse">_</p>
          </div>
        </div>
      </div>

      {/* Red vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(139,0,0,0.3)_100%)]" />
    </div>
  );
}
