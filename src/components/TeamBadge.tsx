"use client";
import React from "react";
import { BRAZILIAN_TEAMS, BrazilianTeam, getTeamByName } from "@/lib/teams";

interface TeamBadgeProps {
  teamNameOrId?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showName?: boolean;
}

export default function TeamBadge({
  teamNameOrId,
  size = "md",
  className = "",
  showName = false,
}: TeamBadgeProps) {
  const team = getTeamByName(teamNameOrId);

  const sizeClasses = {
    xs: "w-4 h-4 text-[8px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-11 h-11 text-sm font-black",
    xl: "w-16 h-16 text-lg font-black",
  };

  if (!team) {
    return (
      <div
        className={`rounded-full bg-arena-800 border border-arena-700 flex items-center justify-center font-bold text-gray-400 ${sizeClasses[size]} ${className}`}
      >
        ⚽
      </div>
    );
  }

  // Renderizador vetorial de escudo oficial estilizado com cores autênticas
  const renderShieldSvg = () => {
    switch (team.id) {
      case "flamengo":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <defs>
              <linearGradient id="flaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d50000" />
                <stop offset="25%" stopColor="#111111" />
                <stop offset="50%" stopColor="#d50000" />
                <stop offset="75%" stopColor="#111111" />
                <stop offset="100%" stopColor="#d50000" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="8" fill="url(#flaGrad)" />
            <rect x="2" y="2" width="36" height="36" rx="6" fill="none" stroke="#ffd700" strokeWidth="1.5" />
            <text x="20" y="25" fill="#ffffff" fontWeight="900" fontSize="13" textAnchor="middle" fontFamily="sans-serif">
              CRF
            </text>
          </svg>
        );

      case "palmeiras":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#006437" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="15" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" />
            <text x="20" y="26" fill="#ffffff" fontWeight="900" fontSize="16" textAnchor="middle" fontFamily="sans-serif">
              P
            </text>
          </svg>
        );

      case "sao-paulo":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="4,6 36,6 20,36" fill="#ffffff" stroke="#111111" strokeWidth="1.5" />
            <polygon points="6,9 20,9 20,28" fill="#d50000" />
            <polygon points="20,9 34,9 20,28" fill="#111111" />
            <rect x="4" y="5" width="32" height="7" fill="#111111" rx="2" />
            <text x="20" y="11" fill="#ffffff" fontWeight="900" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
              SPFC
            </text>
          </svg>
        );

      case "corinthians":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#111111" stroke="#ffffff" strokeWidth="2" />
            <circle cx="20" cy="20" r="14" fill="#ffffff" />
            <polygon points="12,12 28,12 20,26" fill="#cc0000" opacity="0.3" />
            <circle cx="20" cy="20" r="11" fill="#111111" />
            <text x="20" y="24" fill="#ffffff" fontWeight="900" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
              SCCP
            </text>
          </svg>
        );

      case "vasco":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <rect width="40" height="40" rx="8" fill="#111111" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="4" y1="36" x2="36" y2="4" stroke="#ffffff" strokeWidth="7" />
            {/* Cruz de Malta */}
            <path
              d="M 20,13 L 23,17 L 27,14 L 25,20 L 29,22 L 23,24 L 24,28 L 20,25 L 16,28 L 17,24 L 11,22 L 15,20 L 13,14 L 17,17 Z"
              fill="#d50000"
            />
          </svg>
        );

      case "gremio":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#0d80bf" stroke="#ffffff" strokeWidth="2" />
            <rect x="3" y="14" width="34" height="12" fill="#111111" />
            <line x1="3" y1="14" x2="37" y2="14" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="3" y1="26" x2="37" y2="26" stroke="#ffffff" strokeWidth="1.5" />
            <text x="20" y="23" fill="#ffffff" fontWeight="900" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
              GRÊMIO
            </text>
          </svg>
        );

      case "internacional":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#e5050f" stroke="#ffffff" strokeWidth="2" />
            <circle cx="20" cy="20" r="15" fill="none" stroke="#ffffff" strokeWidth="1" />
            <text x="20" y="25" fill="#ffffff" fontWeight="900" fontSize="11" textAnchor="middle" fontFamily="sans-serif">
              SCI
            </text>
          </svg>
        );

      case "botafogo":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#111111" stroke="#ffffff" strokeWidth="2" />
            {/* Estrela Solitária */}
            <polygon
              points="20,10 23,17 31,17 24,22 27,29 20,24 13,29 16,22 9,17 17,17"
              fill="#ffffff"
            />
          </svg>
        );

      case "atletico-mg":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <defs>
              <linearGradient id="galoGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#111111" />
                <stop offset="25%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#111111" />
                <stop offset="75%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#111111" />
              </linearGradient>
            </defs>
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="url(#galoGrad)" stroke="#ffd700" strokeWidth="1.5" />
            <rect x="7" y="6" width="26" height="8" fill="#111111" rx="2" />
            <text x="20" y="13" fill="#ffffff" fontWeight="900" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
              CAM
            </text>
          </svg>
        );

      case "cruzeiro":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#003b8e" stroke="#ffffff" strokeWidth="2" />
            {/* Cruzeiro do Sul */}
            <circle cx="20" cy="11" r="1.8" fill="#ffffff" />
            <circle cx="20" cy="29" r="1.8" fill="#ffffff" />
            <circle cx="12" cy="19" r="1.8" fill="#ffffff" />
            <circle cx="28" cy="19" r="1.8" fill="#ffffff" />
            <circle cx="23" cy="23" r="1.3" fill="#ffffff" />
          </svg>
        );

      case "santos":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#ffffff" stroke="#111111" strokeWidth="2" />
            <line x1="8" y1="18" x2="32" y2="18" stroke="#111111" strokeWidth="1.5" />
            <line x1="14" y1="18" x2="14" y2="35" stroke="#111111" strokeWidth="1.5" />
            <line x1="20" y1="18" x2="20" y2="37" stroke="#111111" strokeWidth="1.5" />
            <line x1="26" y1="18" x2="26" y2="35" stroke="#111111" strokeWidth="1.5" />
            <text x="20" y="14" fill="#111111" fontWeight="900" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
              S.F.C.
            </text>
          </svg>
        );

      case "fluminense":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#85002a" stroke="#ffffff" strokeWidth="1.5" />
            <polygon points="20,3 36,10 20,22" fill="#006437" />
            <polygon points="20,3 4,10 20,22" fill="#006437" />
            <text x="20" y="27" fill="#ffffff" fontWeight="900" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
              FFC
            </text>
          </svg>
        );

      case "bahia":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#002875" stroke="#ffffff" strokeWidth="2" />
            <rect x="12" y="12" width="16" height="11" fill="#ffffff" />
            <rect x="12" y="16" width="16" height="4" fill="#d81d24" />
            <text x="20" y="32" fill="#ffffff" fontWeight="900" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
              BAHIA
            </text>
          </svg>
        );

      case "fortaleza":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#0a2673" stroke="#ffd700" strokeWidth="1.5" />
            <line x1="8" y1="18" x2="32" y2="18" stroke="#d91c24" strokeWidth="4" />
            <text x="20" y="14" fill="#ffffff" fontWeight="900" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
              FEC
            </text>
          </svg>
        );

      case "athletico-pr":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <rect width="40" height="40" rx="8" fill="#111111" stroke="#c8102e" strokeWidth="2" />
            <line x1="8" y1="34" x2="30" y2="6" stroke="#c8102e" strokeWidth="4" />
            <line x1="15" y1="34" x2="34" y2="10" stroke="#c8102e" strokeWidth="3" />
            <text x="18" y="25" fill="#ffffff" fontWeight="900" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
              CAP
            </text>
          </svg>
        );

      case "remo":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#002040" stroke="#ffffff" strokeWidth="2" />
            <circle cx="20" cy="20" r="15" fill="none" stroke="#ffffff" strokeWidth="1" />
            <text x="20" y="24" fill="#ffffff" fontWeight="900" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
              CR
            </text>
          </svg>
        );

      case "chapecoense":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#007a3d" stroke="#ffffff" strokeWidth="2" />
            <circle cx="20" cy="20" r="15" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" />
            <text x="20" y="24" fill="#ffffff" fontWeight="900" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
              ACF
            </text>
          </svg>
        );

      case "mirassol":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#ffd700" stroke="#006437" strokeWidth="2" />
            <text x="20" y="24" fill="#006437" fontWeight="900" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
              MFC
            </text>
          </svg>
        );

      case "bragantino":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#ffffff" stroke="#d50000" strokeWidth="2" />
            <circle cx="20" cy="20" r="11" fill="#d50000" />
            <text x="20" y="24" fill="#ffffff" fontWeight="900" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
              RBB
            </text>
          </svg>
        );

      case "juventude":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="19" fill="#006437" stroke="#ffffff" strokeWidth="2" />
            <line x1="4" y1="20" x2="36" y2="20" stroke="#ffffff" strokeWidth="2" />
            <text x="20" y="16" fill="#ffffff" fontWeight="900" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
              ECJ
            </text>
          </svg>
        );

      case "cuiaba":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#005537" stroke="#ffd700" strokeWidth="2" />
            <text x="20" y="24" fill="#ffd700" fontWeight="900" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
              CUI
            </text>
          </svg>
        );

      case "criciuma":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#ffd700" stroke="#111111" strokeWidth="2" />
            <rect x="8" y="18" width="24" height="6" fill="#111111" />
            <text x="20" y="15" fill="#111111" fontWeight="900" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
              CRI
            </text>
          </svg>
        );

      case "atletico-go":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polygon points="20,2 38,10 32,32 20,38 8,32 2,10" fill="#d50000" stroke="#111111" strokeWidth="2" />
            <polygon points="20,8 34,14 20,24 6,14" fill="#111111" />
            <text x="20" y="20" fill="#ffffff" fontWeight="900" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
              ACG
            </text>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle
              cx="20"
              cy="20"
              r="19"
              fill={team.primaryColor || "#00e676"}
              stroke={team.secondaryColor || "#ffffff"}
              strokeWidth="2"
            />
            <text x="20" y="25" fill="#ffffff" fontWeight="900" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
              {team.shortName}
            </text>
          </svg>
        );
    }
  };

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`shrink-0 rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-0.5 bg-arena-900 border border-arena-750 ${sizeClasses[size]}`}
      >
        {team.badge && !imgError ? (
          <img
            src={team.badge}
            alt={team.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain filter drop-shadow"
          />
        ) : (
          renderShieldSvg()
        )}
      </div>
      {showName && (
        <span className="font-bold text-gray-200 truncate">{team.name}</span>
      )}
    </div>
  );
}

export { TeamBadge };
