"use client";
import { useState, useEffect } from "react";
import { X, Trophy, User, Mail, Phone, Lock, ArrowRight, Loader2, Shield } from "lucide-react";
import { BRAZILIAN_TEAMS } from "@/lib/teams";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "register",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        mode === "register"
          ? { name, email, phone, password, favoriteTeam: favoriteTeam || null }
          : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocorreu um erro. Verifique seus dados.");
      }

      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("bolao_admin_token", data.token);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-arena-900 border border-arena-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-pitch-green/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-arena-800/80 hover:bg-arena-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-pitch-green/10 text-pitch-green mb-3 border border-pitch-green/20">
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === "register" ? "Criar Conta no Bolão" : "Entrar na sua Conta"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {mode === "register"
              ? "Cadastre-se em segundos para enviar seus palpites e concorrer aos prêmios!"
              : "Acesse sua conta para conferir sua pontuação e jogos."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs sm:text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pitch-green focus:ring-1 focus:ring-pitch-green transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              {mode === "login" ? "E-mail ou Usuário" : "E-mail"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={mode === "login" ? "text" : "email"}
                required
                placeholder={mode === "login" ? "goulart ou seu email" : "seuemail@exemplo.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pitch-green focus:ring-1 focus:ring-pitch-green transition"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                WhatsApp (com DDD)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pitch-green focus:ring-1 focus:ring-pitch-green transition"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Utilizado para confirmação e envio da premiação via Pix.
              </p>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Time do Coração (Brasileirão)
              </label>
              <select
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
                className="w-full px-3.5 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-sm focus:outline-none focus:border-pitch-green transition"
              >
                <option value="">Selecione seu time (opcional)</option>
                {BRAZILIAN_TEAMS.map((t) => (
                  <option key={t.id} value={t.name}>
                    ⚽ {t.name} ({t.initials})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pitch-green focus:ring-1 focus:ring-pitch-green transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-pitch-green hover:bg-pitch-light text-arena-950 font-bold rounded-xl text-sm transition shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{mode === "register" ? "Confirmar e Continuar" : "Acessar Bolão"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-arena-800 text-center">
          {mode === "register" ? (
            <p className="text-xs text-gray-400">
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-pitch-green font-semibold hover:underline"
              >
                Fazer login
              </button>
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              Ainda não tem cadastro?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-pitch-green font-semibold hover:underline"
              >
                Cadastre-se grátis
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
