"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, ShieldCheck, User, LogOut, Sparkles, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";
import ProfileModal from "./ProfileModal";
import TeamBadge from "./TeamBadge";
import { getTeamByName } from "@/lib/teams";

interface UserSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  favoriteTeam?: string | null;
  avatar?: string | null;
  pixKey?: string | null;
  pixKeyType?: string | null;
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [profileOpen, setProfileOpen] = useState(false);

  async function checkUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setActiveTournamentId(data.activeTournamentId);
      } else {
        setUser(null);
        setActiveTournamentId(data.activeTournamentId);
      }
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    checkUser();
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-arena-950/80 border-b border-arena-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pitch-dark to-pitch-green p-0.5 shadow-glow">
              <div className="w-full h-full bg-arena-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-pitch-green group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  BOLÃO DOS <span className="text-pitch-green">CRIA</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-400 -mt-0.5 hidden sm:block">Palpites de Futebol</p>
            </div>
          </Link>

          {/* Links desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition hover:text-pitch-green ${
                pathname === "/" ? "text-pitch-green" : "text-gray-300"
              }`}
            >
              Início
            </Link>
            {activeTournamentId && (
              <>
                <Link
                  href={`/bolao/${activeTournamentId}/palpites`}
                  className={`transition hover:text-pitch-green ${
                    pathname.includes("/palpites") ? "text-pitch-green" : "text-gray-300"
                  }`}
                >
                  Meus Palpites
                </Link>
                <Link
                  href={`/bolao/${activeTournamentId}/ranking`}
                  className={`transition hover:text-pitch-green ${
                    pathname.includes("/ranking") ? "text-pitch-green" : "text-gray-300"
                  }`}
                >
                  Classificação
                </Link>
              </>
            )}

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arena-800 border border-arena-700 text-gold-400 font-semibold hover:border-gold-500 transition"
              >
                <ShieldCheck className="w-4 h-4 text-gold-500" />
                Painel Admin
              </Link>
            )}
          </nav>

          {/* Ações de Usuário */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Botão de Perfil / Time */}
                <button
                  onClick={() => setProfileOpen(true)}
                  title="Configurar Perfil, Time do Coração e Chave Pix"
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-arena-900 hover:bg-arena-850 border border-arena-750 hover:border-pitch-green/50 rounded-full transition group"
                >
                  <div className="w-7 h-7 rounded-full bg-arena-800 border border-arena-700 flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : user.favoriteTeam ? (
                      <TeamBadge teamNameOrId={user.favoriteTeam} size="xs" />
                    ) : (
                      <span className="text-pitch-green font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-200 group-hover:text-white max-w-[110px] truncate leading-tight">
                      {user.name.split(" ")[0]}
                    </span>
                    {user.favoriteTeam ? (
                      <span className="text-[9px] text-pitch-green font-medium -mt-0.5">
                        ⚽ {getTeamByName(user.favoriteTeam)?.shortName || user.favoriteTeam}
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-400 group-hover:text-gold-400 -mt-0.5">
                        Escolher Time
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  title="Sair da Conta"
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-arena-800 rounded-full transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthOpen(true);
                  }}
                  className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition"
                >
                  Entrar
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setAuthOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-pitch-green hover:bg-pitch-light text-arena-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-glow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cadastrar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          checkUser();
        }}
      />

      {user && (
        <ProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          currentUser={user as any}
          onProfileUpdated={(updated) => {
            setUser((prev) => (prev ? { ...prev, ...updated } : updated));
          }}
        />
      )}
    </>
  );
}
