"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Send, QrCode, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeTournamentId) {
          setActiveTournamentId(data.activeTournamentId);
        }
        if (data?.user?.role === "ADMIN") {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const tournamentId = activeTournamentId || "default";

  const links = [
    {
      label: "Início",
      href: "/",
      icon: Home,
      active: pathname === "/",
    },
    {
      label: "Palpitar",
      href: activeTournamentId ? `/bolao/${tournamentId}/palpites` : "/",
      icon: Send,
      active: pathname.includes("/palpites"),
    },
    {
      label: "Pagar Pix",
      href: activeTournamentId ? `/bolao/${tournamentId}/pagamento` : "/",
      icon: QrCode,
      active: pathname.includes("/pagamento"),
    },
    {
      label: "Ranking",
      href: activeTournamentId ? `/bolao/${tournamentId}/ranking` : "/",
      icon: Trophy,
      active: pathname.includes("/ranking"),
    },
  ];

  if (isAdmin) {
    links.push({
      label: "Admin",
      href: "/admin",
      icon: Shield,
      active: pathname.startsWith("/admin"),
    });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-arena-950/95 backdrop-blur-lg border-t border-arena-800 pb-safe">
      <div className="grid grid-cols-4 sm:grid-cols-5 h-16 items-center px-1">
        {links.map((link, idx) => {
          const Icon = link.icon;
          return (
            <Link
              key={idx}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 transition ${
                link.active ? "text-pitch-green" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  link.active ? "bg-pitch-green/10" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
