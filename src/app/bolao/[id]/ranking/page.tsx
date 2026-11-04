"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Trophy,
  Share2,
  Copy,
  Check,
  Award,
  Flame,
  Target,
  Loader2,
  MessageCircle,
  Instagram,
  Camera,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import ShareCardModal from "@/components/ShareCardModal";
import ChatResenha from "@/components/ChatResenha";
import TeamBadge from "@/components/TeamBadge";
import { getTeamByName } from "@/lib/teams";

import { parsePrizes } from "@/lib/prizes";

interface RankedParticipant {
  id: string;
  rankPosition: number;
  totalPoints: number;
  exactScoresCount: number;
  winnerPicksCount: number;
  user: {
    id: string;
    name: string;
    favoriteTeam?: string | null;
    avatar?: string | null;
  };
}

export default function RankingPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<RankedParticipant[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  async function loadRanking() {
    setLoading(true);
    try {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
      const authHeaders: Record<string, string> = localToken ? { Authorization: `Bearer ${localToken}` } : {};

      // 1. Usuário logado
      const meRes = await fetch(`/api/auth/me?_t=${Date.now()}`, {
        headers: authHeaders,
        cache: "no-store",
      });
      const meData = await meRes.json();
      if (meData?.user?.id) {
        setCurrentUser(meData.user);
      }

      // 2. Bolão e participantes (sem cache para atualização em tempo real)
      const bolaoRes = await fetch(`/api/bolao/active?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" },
      });
      if (bolaoRes.ok) {
        const data = await bolaoRes.json();
        if (data.tournament) {
          setTournament(data.tournament);
          setParticipants(data.tournament.participants || []);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRanking();
    const interval = setInterval(() => {
      // Recarrega silenciosamente em segundo plano sem travar a tela
      fetch(`/api/bolao/active?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.tournament) {
            setTournament(data.tournament);
            setParticipants(data.tournament.participants || []);
          }
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  // Encontra a posição oficial do usuário logado na ordem da classificação
  const myParticipantIndex = participants.findIndex((p) => p.user.id === currentUser?.id);
  const myParticipant = myParticipantIndex !== -1 ? participants[myParticipantIndex] : null;
  const myRankPosition = myParticipantIndex !== -1 ? myParticipantIndex + 1 : null;

  // Compartilhar no WhatsApp (Texto Rápido)
  function shareOnWhatsApp() {
    const position = myRankPosition || "participando";
    const points = myParticipant?.totalPoints || 0;
    const exacts = myParticipant?.exactScoresCount || 0;
    const bolaoTitle = tournament?.title || "Bolão dos Cria";

    const text = encodeURIComponent(
      `⚽ *${bolaoTitle}*\n` +
      `🔥 Estou em *${position}º Lugar* no ranking com *${points} pontos* e *${exacts} placares cravados*!\n\n` +
      `Acha que entende mais de futebol que eu? Entra lá e tenta me passar:\n` +
      `${window.location.origin}`
    );

    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  // Copiar para Instagram Stories
  async function copyForInstagram() {
    const position = myRankPosition || "1";
    const points = myParticipant?.totalPoints || 0;
    const text = `⚽ ${tournament?.title || "Bolão dos Cria"}\n🏆 Estou em ${position}º Lugar com ${points} pts!\n👉 Faça seu palpite no link da bio!`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      confetti({ particleCount: 50, spread: 50 });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-pitch-green animate-spin mb-4" />
        <p className="text-gray-300 text-sm font-medium">Carregando classificação em tempo real...</p>
      </div>
    );
  }

  const top1 = participants[0];
  const top2 = participants[1];
  const top3 = participants[2];
  const parsedPrizes = parsePrizes(tournament?.prizeDescription, tournament?.prizePool || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* CABEÇALHO */}
      <div className="text-center">
        <div className="inline-flex p-3 rounded-2xl bg-gold-500/10 text-gold-400 mb-2 border border-gold-500/20 shadow-goldglow">
          <Trophy className="w-7 h-7 text-gold-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Classificação Geral
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {tournament?.title || "Bolão Oficial"} • Atualizado em tempo real a cada apito final
        </p>
      </div>

      {/* SELO DE SEGURANÇA E FAIR-PLAY ANTI-FRAUDE */}
      <div className="bg-arena-900/90 border border-pitch-green/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-pitch-green/10 text-pitch-green flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-left">
          <span className="text-[11px] font-black uppercase text-pitch-green tracking-wider block">
            Competição Oficial & Monitoramento Anti-Fraude
          </span>
          <p className="text-[11px] text-gray-300 leading-tight">
            1 participação por jogador / WhatsApp. Contas duplicadas são desclassificadas automaticamente na apuração da premiação no Pix.
          </p>
        </div>
      </div>

      {/* PÓDIO DOS 3 PRIMEIROS COLOCADOS */}
      {participants.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2">
          {/* 2º LUGAR */}
          <div className="bg-arena-900 border border-gray-400/20 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300 text-arena-950 font-black text-sm flex items-center justify-center mb-1.5 shadow-md">
              2º
            </div>
            <span className="text-xs sm:text-sm font-bold text-white truncate w-full">
              {top2.user.name.split(" ")[0]}
            </span>
            {top2.user.favoriteTeam && (
              <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-full">
                ⚽ {getTeamByName(top2.user.favoriteTeam)?.shortName || top2.user.favoriteTeam}
              </span>
            )}
            <span className="text-base sm:text-lg font-mono font-extrabold text-white mt-1">
              {top2.totalPoints} pts
            </span>
            <span className="text-[10px] text-gray-400">{top2.exactScoresCount} cravadas</span>
            <span className="text-[10px] text-gray-300 font-bold mt-1.5 bg-gray-400/10 px-2 py-0.5 rounded-md border border-gray-400/20">
              🥈 {parsedPrizes.secondPlace}
            </span>
          </div>

          {/* 1º LUGAR (MAIS ALTO / DESTAQUE OURO) */}
          <div className="bg-arena-900 border-2 border-gold-500 rounded-3xl p-4 sm:p-5 text-center flex flex-col items-center -translate-y-2 shadow-goldglow relative">
            <div className="absolute -top-3 px-2 py-0.5 bg-gold-500 text-arena-950 text-[10px] font-black rounded-full uppercase tracking-wider">
              Líder Atual
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 text-arena-950 font-black text-lg flex items-center justify-center mb-1.5 shadow-lg">
              👑
            </div>
            <span className="text-sm sm:text-base font-extrabold text-white truncate w-full">
              {top1.user.name.split(" ")[0]}
            </span>
            {top1.user.favoriteTeam && (
              <span className="text-[11px] text-gold-400 font-bold mt-0.5 truncate max-w-full">
                ⚽ {getTeamByName(top1.user.favoriteTeam)?.shortName || top1.user.favoriteTeam}
              </span>
            )}
            <span className="text-xl sm:text-2xl font-mono font-black text-gold-400 mt-1">
              {top1.totalPoints} pts
            </span>
            <span className="text-[11px] text-gray-300 font-semibold">{top1.exactScoresCount} cravadas</span>
            <span className="text-[10px] text-gold-400 font-black mt-1.5 bg-gold-500/10 px-2.5 py-0.5 rounded-md border border-gold-500/30 shadow-goldglow">
              🏆 {parsedPrizes.firstPlace}
            </span>
          </div>

          {/* 3º LUGAR */}
          <div className="bg-arena-900 border border-amber-700/20 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center mb-1.5 shadow-md">
              3º
            </div>
            <span className="text-xs sm:text-sm font-bold text-white truncate w-full">
              {top3.user.name.split(" ")[0]}
            </span>
            {top3.user.favoriteTeam && (
              <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-full">
                ⚽ {getTeamByName(top3.user.favoriteTeam)?.shortName || top3.user.favoriteTeam}
              </span>
            )}
            <span className="text-base sm:text-lg font-mono font-extrabold text-white mt-1">
              {top3.totalPoints} pts
            </span>
            <span className="text-[10px] text-gray-400">{top3.exactScoresCount} cravadas</span>
            {parsedPrizes.thirdPlace && (
              <span className="text-[10px] text-amber-500 font-bold mt-1.5 bg-amber-700/10 px-2 py-0.5 rounded-md border border-amber-700/20">
                🥉 {parsedPrizes.thirdPlace}
              </span>
            )}
          </div>
        </div>
      )}

      {/* CARD DO PRÓPRIO USUÁRIO (SE ESTIVER PARTICIPANDO) */}
      {myParticipant && (
        <div className="bg-pitch-green/10 border border-pitch-green/40 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-glow">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-pitch-green text-arena-950 font-black text-xl flex items-center justify-center shadow-md">
              {myRankPosition}º
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-pitch-green font-bold uppercase tracking-wider">
                  Sua Posição Oficial
                </span>
                {myParticipant.user.favoriteTeam && (
                  <span className="text-[10px] bg-arena-800 text-gray-300 px-1.5 py-0.5 rounded font-semibold">
                    ⚽ {myParticipant.user.favoriteTeam}
                  </span>
                )}
              </div>
              <div className="text-base font-extrabold text-white">{myParticipant.user.name}</div>
              <span className="text-xs text-gray-300">
                {myParticipant.exactScoresCount} placares cravados • {myParticipant.totalPoints} pontos acumulados
              </span>
            </div>
          </div>

          {/* BOTÃO GERAR FIGURINHA / FOTO DO RANKING */}
          <button
            onClick={() => {
              setShareModalOpen(true);
              confetti({ particleCount: 30, spread: 45 });
            }}
            className="w-full sm:w-auto py-3 px-5 bg-gradient-to-r from-gold-500 to-pitch-green hover:from-gold-400 hover:to-pitch-light text-arena-950 font-black rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-goldglow active:scale-95 animate-neon-pulse"
          >
            <Camera className="w-4 h-4" />
            <span>Gerar Foto / Figurinha do Ranking</span>
          </button>
        </div>
      )}

      {/* BOTÕES DE COMPARTILHAMENTO SOCIAL (WHATSAPP E INSTAGRAM) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={shareOnWhatsApp}
          className="py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-arena-950 font-bold rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95"
        >
          <MessageCircle className="w-4 h-4 fill-arena-950" />
          <span>Texto no WhatsApp</span>
        </button>

        <button
          onClick={copyForInstagram}
          className="py-3 px-4 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Copiado p/ Stories!</span>
            </>
          ) : (
            <>
              <Instagram className="w-4 h-4" />
              <span>Texto p/ Stories</span>
            </>
          )}
        </button>
      </div>

      {/* TABELA COMPLETA DE CLASSIFICAÇÃO */}
      <div className="bg-arena-900 border border-arena-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-4 py-3.5 bg-arena-850/80 border-b border-arena-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider grid grid-cols-12 items-center">
          <div className="col-span-2">Pos</div>
          <div className="col-span-6">Jogador</div>
          <div className="col-span-2 text-center">Cravadas</div>
          <div className="col-span-2 text-right">Pontos</div>
        </div>

        <div className="divide-y divide-arena-800/80">
          {participants.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhum participante com pagamento confirmado ainda. Seja o primeiro a se inscrever!
            </div>
          ) : (
            participants.map((part, index) => {
              const isMe = part.user.id === currentUser?.id;
              const team = getTeamByName(part.user.favoriteTeam);
              const position = index + 1;

              return (
                <div
                  key={part.id}
                  className={`px-4 py-3.5 grid grid-cols-12 items-center text-sm transition ${
                    isMe ? "bg-pitch-green/10 font-bold text-white" : "hover:bg-arena-850/50 text-gray-200"
                  }`}
                >
                  {/* Posição */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        position === 1
                          ? "bg-gold-500 text-arena-950 font-black shadow-goldglow"
                          : position === 2
                          ? "bg-gray-300 text-arena-950 font-bold"
                          : position === 3
                          ? "bg-amber-700 text-white font-bold"
                          : "text-gray-400 font-mono font-bold"
                      }`}
                    >
                      {position}º
                    </span>
                  </div>

                  {/* Nome do Jogador e Time do Coração */}
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    {/* Mini escudo ou avatar */}
                    {part.user.avatar ? (
                      <img
                        src={part.user.avatar}
                        alt={part.user.name}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    ) : part.user.favoriteTeam ? (
                      <TeamBadge teamNameOrId={part.user.favoriteTeam} size="xs" />
                    ) : null}

                    <span className="truncate">{part.user.name}</span>

                    {team && (
                      <span className="hidden sm:inline text-[9px] text-gray-400 font-medium">
                        ({team.shortName})
                      </span>
                    )}

                    {isMe && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-pitch-green/20 text-pitch-green font-bold shrink-0">
                        Você
                      </span>
                    )}
                  </div>

                  {/* Placares Exatos Cravados */}
                  <div className="col-span-2 text-center flex items-center justify-center gap-1 font-mono text-xs text-gray-300">
                    <Target className="w-3.5 h-3.5 text-pitch-green" />
                    <span>{part.exactScoresCount}</span>
                  </div>

                  {/* Pontuação Total */}
                  <div className="col-span-2 text-right font-mono font-extrabold text-pitch-green text-base">
                    {part.totalPoints}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* BATE-PAPO / RESENHA DOS PALPITEIROS AO VIVO */}
      <ChatResenha tournamentId={tournamentId} currentUser={currentUser} />

      {/* MODAL DE COMPARTILHAMENTO DE IMAGEM */}
      {myParticipant && (
        <ShareCardModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          participant={myParticipant}
          tournamentTitle={tournament?.title || "Bolão dos Cria"}
        />
      )}
    </div>
  );
}
