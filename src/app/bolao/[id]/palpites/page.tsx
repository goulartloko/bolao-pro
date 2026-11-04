"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Zap,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Trophy,
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import AuthModal from "@/components/AuthModal";
import TeamBadge from "@/components/TeamBadge";
import { formatMatchDate } from "@/lib/dateUtils";

interface MatchItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  stadium?: string | null;
  matchDate: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

export default function PalpitesPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [predictions, setPredictions] = useState<Record<string, { home: number; away: number }>>({});
  const [existingPredictions, setExistingPredictions] = useState<Record<string, any>>({});
  const [isPaid, setIsPaid] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadData(isInitial = false) {
    if (isInitial && matches.length === 0) setLoading(true);
    setErrorMessage(null);

    try {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
      const authHeaders: Record<string, string> = localToken ? { Authorization: `Bearer ${localToken}` } : {};

      // 1. Busca dados da sessão e do bolão em paralelo
      const [meRes, bolaoRes] = await Promise.all([
        fetch(`/api/auth/me?_t=${Date.now()}`, { headers: authHeaders, cache: "no-store" }),
        fetch(`/api/bolao/active?_t=${Date.now()}`, { cache: "no-store" }),
      ]);

      const meData = await meRes.json();
      const bData = await bolaoRes.json();

      let activeTourn = bData.tournament;
      if (activeTourn) {
        setTournament(activeTourn);
        setMatches(activeTourn.matches || []);
      }

      const isFreeTourn = activeTourn?.entryFee === 0;

      if (meData?.authenticated && meData.user) {
        setCurrentUser(meData.user);
        setIsPaid(isFreeTourn || meData.participantStatus === "PAID");

        // 2. Busca palpites já salvos no banco
        const predRes = await fetch(`/api/predictions?tournamentId=${tournamentId}&_t=${Date.now()}`, {
          headers: authHeaders,
          cache: "no-store",
        });

        if (predRes.ok) {
          const predData = await predRes.json();
          const predMap: Record<string, { home: number; away: number }> = {};
          const detailMap: Record<string, any> = {};

          if (Array.isArray(predData.predictions) && predData.predictions.length > 0) {
            predData.predictions.forEach((p: any) => {
              predMap[p.matchId] = { home: p.homeScore, away: p.awayScore };
              detailMap[p.matchId] = p;
            });
            setPredictions(predMap);
            setExistingPredictions(detailMap);

            if (predData.isLocked || predData.predictions.some((p: any) => p.isLocked)) {
              setIsLocked(true);
            }
          } else {
            // Se ainda não salvou no banco, restaura rascunho salvo se existir
            try {
              const draft = localStorage.getItem(`bolao_draft_${tournamentId}`);
              if (draft) {
                const parsed = JSON.parse(draft);
                if (parsed && typeof parsed === "object") {
                  setPredictions(parsed);
                }
              }
            } catch (e) {}
          }
        }
      } else {
        // Usuário não autenticado
        setCurrentUser(null);
        setIsPaid(isFreeTourn);
        try {
          const draft = localStorage.getItem(`bolao_draft_${tournamentId}`);
          if (draft) {
            const parsed = JSON.parse(draft);
            if (parsed && typeof parsed === "object") {
              setPredictions(parsed);
            }
          }
        } catch (e) {}
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(true);
  }, [tournamentId]);

  // Atualiza placar de um jogo no formulário local e salva no rascunho
  function updateScore(matchId: string, side: "home" | "away", delta: number) {
    if (isLocked) return;
    setPredictions((prev) => {
      const current = prev[matchId] || { home: 0, away: 0 };
      const nextVal = Math.max(0, current[side] + delta);
      const updated = {
        ...prev,
        [matchId]: {
          ...current,
          [side]: nextVal,
        },
      };
      try {
        localStorage.setItem(`bolao_draft_${tournamentId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  function setDirectScore(matchId: string, side: "home" | "away", value: string) {
    if (isLocked) return;
    const parsed = Math.max(0, parseInt(value || "0", 10));
    setPredictions((prev) => {
      const current = prev[matchId] || { home: 0, away: 0 };
      const updated = {
        ...prev,
        [matchId]: {
          ...current,
          [side]: isNaN(parsed) ? 0 : parsed,
        },
      };
      try {
        localStorage.setItem(`bolao_draft_${tournamentId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  // Enviar palpites para o backend com travamento definitivo
  async function handleSave() {
    if (isLocked) return;

    const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
    if (!localToken || !currentUser) {
      setAuthOpen(true);
      return;
    }

    const confirmSave = confirm(
      "Atenção: Ao confirmar seus palpites, eles serão TRAVADOS definitivamente para esta rodada e não poderão ser alterados. Deseja confirmar agora?"
    );

    if (!confirmSave) return;

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = Object.entries(predictions).map(([matchId, scores]) => ({
        matchId,
        homeScore: scores.home,
        awayScore: scores.away,
      }));

      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localToken}`,
        },
        body: JSON.stringify({
          tournamentId,
          predictions: payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar palpites.");
      }

      try {
        localStorage.removeItem(`bolao_draft_${tournamentId}`);
      } catch (e) {}

      setIsLocked(true);
      setSuccessMessage("✅ Palpites gravados com sucesso! Seus palpites estão travados para a apuração oficial.");

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Recarrega dados silenciosamente
      loadData(false);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Compartilhar no WhatsApp
  function sharePredictions() {
    const title = tournament?.title || "Bolão dos Cria";
    const text = encodeURIComponent(
      `⚽ *Meus Palpites no ${title}*\n` +
      `🔥 Já enviei e travei meus palpites da rodada! Acompanhe a classificação em tempo real:\n` +
      `${window.location.origin}/bolao/${tournamentId}/ranking`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-pitch-green animate-spin mb-4" />
        <p className="text-gray-300 text-sm font-medium">Carregando jogos da rodada...</p>
      </div>
    );
  }

  // 1. BLOQUEIO SE O USUÁRIO LOGADO NÃO ESTÁ COM INSCRIÇÃO APROVADA EM BOLÃO PAGO
  if (tournament && tournament.entryFee > 0 && currentUser && !isPaid) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-arena-900 border border-arena-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Acesso aos Palpites Bloqueado</h1>
          <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
            Para garantir a integridade do bolão e liberar a premiação, é necessário confirmar o pagamento da taxa de inscrição no Pix.
          </p>

          <Link
            href={`/bolao/${tournamentId}/pagamento`}
            className="w-full py-4 px-6 bg-pitch-green hover:bg-pitch-light text-arena-950 font-extrabold text-sm rounded-xl transition shadow-glow flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-arena-950" />
            <span>Pagar Inscrição no Pix Agora</span>
          </Link>

          <div className="mt-4">
            <button
              onClick={() => loadData(false)}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Já paguei? Atualizar status
            </button>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();

  // Cálculo rigoroso do prazo: 5 minutos antes do 1º jogo da rodada
  const matchTimes = matches.map((m: any) => new Date(m.matchDate).getTime());
  const earliestMatchTime = matchTimes.length > 0 ? Math.min(...matchTimes) : null;
  const fiveMinBeforeFirst = earliestMatchTime ? earliestMatchTime - 5 * 60 * 1000 : null;

  let effectiveDeadlineMs = tournament?.deadlinePredictions
    ? new Date(tournament.deadlinePredictions).getTime()
    : 0;
  if (fiveMinBeforeFirst && (effectiveDeadlineMs === 0 || fiveMinBeforeFirst < effectiveDeadlineMs)) {
    effectiveDeadlineMs = fiveMinBeforeFirst;
  }

  const isDeadlinePassed = effectiveDeadlineMs > 0 && now.getTime() >= effectiveDeadlineMs;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* BANNER PARA JOGADORES AINDA NÃO CONECTADOS */}
      {!currentUser && (
        <div className="mb-6 p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-goldglow">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-gold-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Preencha seus palpites com tranquilidade!</span>
              <span className="text-[11px] text-gray-300">Entre na sua conta ou cadastre-se grátis para salvar e disputar a premiação no Pix.</span>
            </div>
          </div>
          <button
            onClick={() => setAuthOpen(true)}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-arena-950 font-bold text-xs rounded-xl transition shadow-sm shrink-0"
          >
            Entrar / Cadastrar Grátis
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-pitch-green text-xs font-bold uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{currentUser ? "Inscrição Confirmada" : "Rodada 100% Gratuita"}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Meus Palpites</h1>
          <p className="text-xs text-gray-400">
            {isLocked
              ? "Seus palpites estão confirmados e travados para a apuração oficial."
              : isDeadlinePassed
              ? "O prazo para envio de palpites encerrou 5 minutos antes do primeiro jogo."
              : "Preencha seus palpites e clique em Salvar para travar suas escolhas."}
          </p>
        </div>

        {isLocked || isDeadlinePassed ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/bolao/${tournamentId}/ranking`}
              className="py-2.5 px-4 bg-gold-500 hover:bg-gold-400 text-arena-950 font-extrabold text-xs rounded-xl transition shadow-goldglow flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span>Ver Classificação</span>
            </Link>
            <button
              onClick={sharePredictions}
              className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba5a] text-arena-950 font-bold text-xs rounded-xl transition flex items-center gap-1"
              title="Compartilhar no WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-arena-950" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="py-3 px-6 bg-pitch-green hover:bg-pitch-light text-arena-950 font-bold rounded-xl text-sm transition shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Confirmar e Travar Palpites</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* BANNER DE PRAZO ENCERRADO (5 MIN ANTES DO 1º JOGO) */}
      {isDeadlinePassed && !isLocked && (
        <div className="mb-6 p-4 bg-arena-900 border-2 border-red-500/40 rounded-2xl text-xs sm:text-sm shadow-glow flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 shrink-0 mt-0.5 border border-red-500/30">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-1.5">
              <span>Palpites Desta Rodada Encerrados</span>
            </h3>
            <p className="text-gray-300 text-xs mt-1 leading-relaxed">
              Conforme as regras oficiais, o envio de palpites foi encerrado 5 minutos antes do início do primeiro jogo para garantir a transparência da apuração. Acompanhe a pontuação ao vivo no Ranking!
            </p>
          </div>
        </div>
      )}

      {/* BANNER DE TRAVAMENTO DEFINITIVO */}
      {isLocked && (
        <div className="mb-6 p-4 bg-arena-900 border-2 border-pitch-green/40 rounded-2xl text-xs sm:text-sm shadow-glow flex items-start gap-3">
          <div className="p-2 rounded-xl bg-pitch-green/10 text-pitch-green shrink-0 mt-0.5 border border-pitch-green/30">
            <ShieldCheck className="w-5 h-5 text-pitch-green" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-1.5">
              <span>Palpites Confirmados e Travados!</span>
            </h3>
            <p className="text-gray-300 text-xs mt-1 leading-relaxed">
              Seus palpites foram computados com sucesso e estão travados para apuração oficial. Eles não podem mais ser alterados. Acompanhe a atualização automática dos seus pontos no Ranking a cada apito final!
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-pitch-green/10 border border-pitch-green/30 rounded-xl text-pitch-green text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* LISTA DE JOGOS E INPUTS DE PALPITES */}
      <div className="space-y-4">
        {matches.map((match) => {
          const matchDeadline = new Date(match.matchDate).getTime() - 5 * 60 * 1000;
          const isMatchLocked = isLocked || isDeadlinePassed || now.getTime() >= matchDeadline || match.status !== "SCHEDULED";
          const currentScore = predictions[match.id] || { home: 0, away: 0 };
          const detail = existingPredictions[match.id];

          return (
            <div
              key={match.id}
              className={`bg-arena-900 border rounded-2xl p-4 transition ${
                isLocked
                  ? "border-pitch-green/30 bg-arena-900/90"
                  : isMatchLocked
                  ? "border-arena-800 opacity-90"
                  : "border-arena-750 hover:border-pitch-green/40"
              }`}
            >
              {/* Topo do Card: Local, Data e Status */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3 border-b border-arena-800/80 pb-2">
                <span className="truncate max-w-[200px]">{match.stadium || "Estádio da Rodada"}</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-300">
                    {formatMatchDate(match.matchDate)}
                  </span>
                  {isLocked && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-pitch-green/10 text-pitch-green text-[10px] font-bold border border-pitch-green/20">
                      Palpite Travado
                    </span>
                  )}
                </div>
              </div>

              {/* Grid do Confronto e Controles de Placar */}
              <div className="grid grid-cols-7 items-center gap-2">
                {/* Mandante */}
                <div className="col-span-3 flex flex-col items-center sm:items-end text-center sm:text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px] sm:max-w-[150px]">
                      {match.homeTeam}
                    </span>
                    <TeamBadge teamNameOrId={match.homeTeam} size="md" />
                  </div>

                  {/* Controles de Placar Casa */}
                  {isLocked ? (
                    <div className="w-12 h-11 bg-pitch-green/10 border-2 border-pitch-green/40 rounded-xl flex items-center justify-center font-mono font-black text-xl text-pitch-green shadow-glow">
                      {currentScore.home}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isMatchLocked}
                        onClick={() => updateScore(match.id, "home", -1)}
                        className="w-8 h-8 rounded-lg bg-arena-800 hover:bg-arena-750 disabled:opacity-30 text-gray-300 flex items-center justify-center text-sm font-bold active:scale-95 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        disabled={isMatchLocked}
                        value={currentScore.home}
                        onChange={(e) => setDirectScore(match.id, "home", e.target.value)}
                        className="w-11 h-10 bg-arena-850 border border-arena-700 rounded-lg text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-pitch-green disabled:opacity-60"
                      />
                      <button
                        type="button"
                        disabled={isMatchLocked}
                        onClick={() => updateScore(match.id, "home", 1)}
                        className="w-8 h-8 rounded-lg bg-arena-800 hover:bg-arena-750 disabled:opacity-30 text-gray-300 flex items-center justify-center text-sm font-bold active:scale-95 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* X central */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-gray-500 uppercase mb-1">X</span>
                  {match.status === "FINISHED" && (
                    <div className="text-[10px] bg-arena-800 px-1.5 py-0.5 rounded text-gold-400 font-mono font-bold">
                      {match.homeScore} x {match.awayScore}
                    </div>
                  )}
                </div>

                {/* Visitante */}
                <div className="col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <TeamBadge teamNameOrId={match.awayTeam} size="md" />
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px] sm:max-w-[150px]">
                      {match.awayTeam}
                    </span>
                  </div>

                  {/* Controles de Placar Fora */}
                  {isLocked ? (
                    <div className="w-12 h-11 bg-pitch-green/10 border-2 border-pitch-green/40 rounded-xl flex items-center justify-center font-mono font-black text-xl text-pitch-green shadow-glow">
                      {currentScore.away}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isMatchLocked}
                        onClick={() => updateScore(match.id, "away", -1)}
                        className="w-8 h-8 rounded-lg bg-arena-800 hover:bg-arena-750 disabled:opacity-30 text-gray-300 flex items-center justify-center text-sm font-bold active:scale-95 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        disabled={isMatchLocked}
                        value={currentScore.away}
                        onChange={(e) => setDirectScore(match.id, "away", e.target.value)}
                        className="w-11 h-10 bg-arena-850 border border-arena-700 rounded-lg text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-pitch-green disabled:opacity-60"
                      />
                      <button
                        type="button"
                        disabled={isMatchLocked}
                        onClick={() => updateScore(match.id, "away", 1)}
                        className="w-8 h-8 rounded-lg bg-arena-800 hover:bg-arena-750 disabled:opacity-30 text-gray-300 flex items-center justify-center text-sm font-bold active:scale-95 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback de Pontuação se a partida já finalizou */}
              {match.status === "FINISHED" && detail && (
                <div className="mt-3 pt-2.5 border-t border-arena-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Resultado Oficial: <strong className="text-white">{match.homeScore} x {match.awayScore}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {detail.scoreType === "EXACT" ? (
                      <span className="text-pitch-green bg-pitch-green/10 px-2 py-0.5 rounded-full border border-pitch-green/20 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Placar Cravado! +{detail.pointsEarned} pts
                      </span>
                    ) : detail.pointsEarned > 0 ? (
                      <span className="text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full border border-gold-500/20">
                        Vencedor Correto! +{detail.pointsEarned} pts
                      </span>
                    ) : (
                      <span className="text-gray-500">0 pts</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTÃO NO RODAPÉ */}
      <div className="sticky bottom-20 md:bottom-6 mt-6">
        {isLocked ? (
          <Link
            href={`/bolao/${tournamentId}/ranking`}
            className="w-full py-4 px-6 bg-gold-500 hover:bg-gold-400 text-arena-950 font-black text-base rounded-2xl transition shadow-goldglow flex items-center justify-center gap-2 active:scale-98"
          >
            <Trophy className="w-5 h-5 text-arena-950" />
            <span>Acompanhar Minha Posição no Ranking</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 px-6 bg-pitch-green hover:bg-pitch-light text-arena-950 font-black text-base rounded-2xl transition shadow-glow flex items-center justify-center gap-2 active:scale-98"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Confirmar e Travar Meus Palpites</span>
              </>
            )}
          </button>
        )}
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          loadData(false);
        }}
      />
    </div>
  );
}
