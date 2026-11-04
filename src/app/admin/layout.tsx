"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Calendar,
  Users,
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Estados para login direto do Admin
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function checkAdminAuth() {
    try {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
      const res = await fetch(`/api/auth/me?_t=${Date.now()}`, {
        headers: localToken ? { Authorization: `Bearer ${localToken}` } : {},
        cache: "no-store",
      });
      const data = await res.json();
      if (data.authenticated && data.user?.role === "ADMIN") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    checkAdminAuth();
  }, []);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "E-mail ou senha incorretos.");

      if (data.user?.role !== "ADMIN") {
        throw new Error("Acesso negado: esta conta não possui privilégios de Administrador.");
      }

      if (data.token) {
        localStorage.setItem("bolao_admin_token", data.token);
      }

      setIsAdmin(true);
      window.location.reload();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4" />
        <p className="text-gray-300 text-sm font-medium">Verificando credenciais de segurança...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-arena-900 border border-arena-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 bg-gold-500/10 text-gold-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gold-500/30 shadow-goldglow">
            <Lock className="w-7 h-7 text-gold-500" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white text-center mb-1">
            Acesso Restrito ao Administrador
          </h1>
          <p className="text-xs text-gray-400 text-center mb-6">
            Insira suas credenciais administrativas para acessar a gestão do bolão.
          </p>

          {authError && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Usuário ou E-mail de Administrador
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="goulart ou admin@seusite.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 px-4 bg-gold-500 hover:bg-gold-400 text-arena-950 font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-goldglow active:scale-95 disabled:opacity-50"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Autenticar no Painel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-arena-800 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para a Página Pública</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { label: "Visão Geral", href: "/admin", icon: LayoutDashboard },
    { label: "Configurar Bolão", href: "/admin/bolao", icon: Settings },
    { label: "Gestão de Jogos", href: "/admin/jogos", icon: Calendar },
    { label: "Participantes & Pix", href: "/admin/participantes", icon: Users },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Topo do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-arena-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-gold-500" />
            <span>Painel Administrativo Restrito</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Admin Control Center
          </h1>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-arena-850 hover:bg-arena-800 text-gray-300 hover:text-white rounded-xl text-xs font-semibold border border-arena-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ver Bolão Público</span>
        </Link>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                isActive
                  ? "bg-gold-500 text-arena-950 shadow-goldglow"
                  : "bg-arena-900 border border-arena-800 text-gray-300 hover:text-white hover:border-arena-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Conteúdo da Aba */}
      <div>{children}</div>
    </div>
  );
}
