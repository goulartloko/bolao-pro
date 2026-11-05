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
  Eye,
  X,
  Calendar,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";
import ShareCardModal from "@/components/ShareCardModal";
import ChatResenha from "@/components/ChatResenha";
import TeamBadge from "@/components/TeamBadge";
import { getTeamByName } from "@/lib/teams";
import { formatMatchDate } from "@/lib/dateUtils";

import { parsePrizes } from "@/lib/prizes";

interface PredictionItem {
  id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  pointsEarned: number;
  scoreType: string;
  isLocked: boolean;
}

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
  predictions?: PredictionItem[];
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
  const [selectedParticipant, setSelectedParticipant] = useState<RankedParticipant | null>(null);

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
            <div className="text-[10px] text-gray-300 space-y-0.5 mt-0.5">
              <span>🎯 {top2.exactScoresCount} cravadas</span>
              <span className="text-gray-400 block">🏆 {top2.winnerPicksCount} acertos</span>
            </div>
            <button
              onClick={() => setSelectedParticipant(top2)}
              className="mt-1.5 text-[10px] text-pitch-green hover:underline flex items-center gap-1 font-bold"
            >
              <Eye className="w-3 h-3" />
              <span>Ver Palpites</span>
            </button>
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
            <div className="text-[11px] text-gray-200 font-semibold space-y-0.5 mt-0.5">
              <span className="text-gold-400 block">🎯 {top1.exactScoresCount} cravadas</span>
              <span className="text-gray-300 block">🏆 {top1.winnerPicksCount} acertos</span>
            </div>
            <button
              onClick={() => setSelectedParticipant(top1)}
              className="mt-2 px-2.5 py-1 rounded-xl bg-gold-500/20 text-gold-300 text-[10px] font-black hover:bg-gold-500/30 transition flex items-center gap-1 border border-gold-500/30"
            >
              <Eye className="w-3 h-3" />
              <span>Ver Palpites</span>
            </button>
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
            <div className="text-[10px] text-gray-300 space-y-0.5 mt-0.5">
              <span>🎯 {top3.exactScoresCount} cravadas</span>
              <span className="text-gray-400 block">🏆 {top3.winnerPicksCount} acertos</span>
            </div>
            <button
              onClick={() => setSelectedParticipant(top3)}
              className="mt-1.5 text-[10px] text-pitch-green hover:underline flex items-center gap-1 font-bold"
            >
              <Eye className="w-3 h-3" />
              <span>Ver Palpites</span>
            </button>
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
                {myParticipant.exactScoresCount} cravadas • {myParticipant.winnerPicksCount} acertos • {myParticipant.totalPoints} pontos acumulados
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedParticipant(myParticipant)}
              className="py-3 px-4 bg-arena-850 hover:bg-arena-800 border border-arena-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-pitch-green" />
              <span>Meus Palpites</span>
            </button>

            {/* BOTÃO GERAR FIGURINHA / FOTO DO RANKING */}
            <button
              onClick={() => {
                setShareModalOpen(true);
                confetti({ particleCount: 30, spread: 45 });
              }}
              className="flex-1 sm:flex-none py-3 px-5 bg-gradient-to-r from-gold-500 to-pitch-green hover:from-gold-400 hover:to-pitch-light text-arena-950 font-black rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-goldglow active:scale-95 animate-neon-pulse"
            >
              <Camera className="w-4 h-4" />
              <span>Gerar Figurinha</span>
            </button>
          </div>
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

      {/* GUIA DE TRANSPARÊNCIA DA PONTUAÇÃO */}
      <div className="bg-arena-900 border border-arena-750/80 rounded-2xl p-3.5 text-xs text-gray-300 space-y-1.5">
        <div className="flex items-center gap-1.5 text-pitch-green font-black uppercase tracking-wider text-[11px]">
          <Info className="w-4 h-4" />
          <span>Como é calculada a pontuação de cada jogador:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="bg-arena-850 p-2 rounded-xl border border-arena-800">
            <span className="text-pitch-green font-bold block">🎯 Placar Exato (Cravada):</span>
            <span className="text-white font-mono font-bold">+10 pontos</span> no jogo
          </div>
          <div className="bg-arena-850 p-2 rounded-xl border border-arena-800">
            <span className="text-gold-400 font-bold block">🏆 Vencedor / Empate:</span>
            <span className="text-white font-mono font-bold">+5 pontos</span> (+2 pts com saldo)
          </div>
          <div className="bg-arena-850 p-2 rounded-xl border border-arena-800 flex items-center justify-center text-center text-gray-400">
            👉 Toque em qualquer jogador para ver todos os palpites dele jogo a jogo!
          </div>
        </div>
      </div>

      {/* TABELA COMPLETA DE CLASSIFICAÇÃO */}
      <div className="bg-arena-900 border border-arena-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-3 sm:px-4 py-3 bg-arena-850/90 border-b border-arena-800 text-[11px] font-black text-gray-400 uppercase tracking-wider grid grid-cols-12 items-center">
          <div className="col-span-2 sm:col-span-1">Pos</div>
          <div className="col-span-4 sm:col-span-5">Jogador</div>
          <div className="col-span-2 text-center" title="Placares Exatos Cravados (10 pts cada)">🎯 Cravadas</div>
          <div className="col-span-2 text-center" title="Jogos Acertados (Vencedor ou Empate)">🏆 Acertos</div>
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
                  onClick={() => setSelectedParticipant(part)}
                  className={`px-3 sm:px-4 py-3.5 grid grid-cols-12 items-center text-sm transition cursor-pointer select-none ${
                    isMe ? "bg-pitch-green/10 font-bold text-white border-l-4 border-pitch-green" : "hover:bg-arena-850/80 text-gray-200"
                  }`}
                  title="Clique para conferir os palpites deste jogador"
                >
                  {/* Posição */}
                  <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
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
                  <div className="col-span-4 sm:col-span-5 flex items-center gap-2 truncate pr-1">
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

                    <div className="truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate font-bold">{part.user.name}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-pitch-green/20 text-pitch-green font-bold shrink-0">
                            Você
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-pitch-green sm:hidden flex items-center gap-0.5 hover:underline font-medium">
                        <Eye className="w-2.5 h-2.5" />
                        <span>Ver palpites</span>
                      </span>
                    </div>
                  </div>

                  {/* Placares Exatos Cravados */}
                  <div className="col-span-2 text-center flex items-center justify-center gap-1 font-mono text-xs text-gray-200">
                    <Target className="w-3.5 h-3.5 text-pitch-green" />
                    <span className="font-bold">{part.exactScoresCount}</span>
                  </div>

                  {/* Jogos Acertados (Vencedor / Empate) */}
                  <div className="col-span-2 text-center flex items-center justify-center gap-1 font-mono text-xs text-gold-400">
                    <Trophy className="w-3.5 h-3.5 text-gold-400" />
                    <span className="font-bold">{part.winnerPicksCount}</span>
                  </div>

                  {/* Pontuação Total */}
                  <div className="col-span-2 text-right">
                    <span className="font-mono font-extrabold text-pitch-green text-sm sm:text-base">
                      {part.totalPoints}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1">pts</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE CONFERÊNCIA DOS PALPITES DO JOGADOR */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-arena-900 border border-arena-700 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-arena-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pitch-green/10 text-pitch-green flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Palpites de {selectedParticipant.user.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Classificação Oficial: <strong className="text-pitch-green">{selectedParticipant.rankPosition || 1}º Lugar</strong>
                    {selectedParticipant.user.favoriteTeam && ` • ⚽ ${selectedParticipant.user.favoriteTeam}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-arena-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* RESUMO DOS PONTOS */}
            <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-2xl bg-arena-850 border border-arena-800 text-center">
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Total Geral</span>
                <span className="text-base sm:text-lg font-black text-pitch-green font-mono">
                  {selectedParticipant.totalPoints} pts
                </span>
              </div>
              <div className="border-x border-arena-750">
                <span className="block text-[10px] text-pitch-green uppercase font-bold">🎯 Cravadas</span>
                <span className="text-base sm:text-lg font-black text-white font-mono">
                  {selectedParticipant.exactScoresCount}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-gold-400 uppercase font-bold">🏆 Acertos</span>
                <span className="text-base sm:text-lg font-black text-white font-mono">
                  {selectedParticipant.winnerPicksCount}
                </span>
              </div>
            </div>

            {/* LISTA DOS JOGOS E PALPITES */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {tournament?.matches?.map((match: any) => {
                const pred = (selectedParticipant.predictions || []).find((p) => p.matchId === match.id);
                const isFinished = match.status === "FINISHED";

                return (
                  <div
                    key={match.id}
                    className={`p-3 rounded-2xl border transition ${
                      isFinished
                        ? pred?.scoreType === "EXACT"
                          ? "bg-pitch-green/10 border-pitch-green/40 shadow-sm"
                          : pred?.scoreType === "WINNER_WITH_DIFF" || pred?.scoreType === "WINNER_ONLY"
                          ? "bg-gold-500/10 border-gold-500/30"
                          : "bg-arena-850/80 border-arena-800"
                        : "bg-arena-850/40 border-arena-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        {formatMatchDate(match.matchDate)}
                      </span>
                      {isFinished ? (
                        <span className="px-2 py-0.5 rounded-full bg-pitch-green/15 text-pitch-green font-bold text-[10px]">
                          Finalizado ({match.homeScore} x {match.awayScore})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-arena-800 text-gray-400 text-[10px]">
                          Agendado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Times e Escudos */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span className="min-w-[65px] sm:min-w-[85px] text-right truncate">{match.homeTeam}</span>
                        <TeamBadge teamNameOrId={match.homeTeam} size="xs" />
                        <span className="text-gray-500 font-mono text-[10px]">x</span>
                        <TeamBadge teamNameOrId={match.awayTeam} size="xs" />
                        <span className="min-w-[65px] sm:min-w-[85px] text-left truncate">{match.awayTeam}</span>
                      </div>

                      {/* Palpite do Jogador e Pontos */}
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-xl bg-arena-950 border border-arena-700 font-mono font-black text-white text-xs">
                          {pred ? `${pred.homeScore} x ${pred.awayScore}` : "Sem palpite"}
                        </div>

                        {/* Pontos Ganhos */}
                        {isFinished && (
                          <div className="min-w-[70px] text-right">
                            {pred?.scoreType === "EXACT" ? (
                              <span className="text-xs font-black text-pitch-green block">
                                +10 pts 🎯
                              </span>
                            ) : pred?.scoreType === "WINNER_WITH_DIFF" ? (
                              <span className="text-xs font-bold text-gold-400 block" title="Acertou vencedor + saldo de gols">
                                +7 pts 🏆
                              </span>
                            ) : pred?.scoreType === "WINNER_ONLY" ? (
                              <span className="text-xs font-bold text-gold-400 block" title="Acertou vencedor">
                                +5 pts 🏆
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-gray-500 block">
                                0 pts ❌
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-arena-800 mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="py-2.5 px-6 bg-arena-800 hover:bg-arena-750 text-white font-bold text-xs rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
