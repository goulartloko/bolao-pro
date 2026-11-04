"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  Zap,
} from "lucide-react";
import { formatMatchDate } from "@/lib/dateUtils";
import { TeamBadge } from "@/components/TeamBadge";

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

export default function AdminJogosPage() {
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const [savingScoreId, setSavingScoreId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form de novo jogo
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMatch, setNewMatch] = useState({
    homeTeam: "",
    awayTeam: "",
    stadium: "",
    matchDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });
  const [addingMatch, setAddingMatch] = useState(false);
  const [syncing, setSyncing] = useState(false);

  function getAuthHeaders() {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
    return {
      "Content-Type": "application/json",
      ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
    };
  }

  const [syncingResults, setSyncingResults] = useState(false);

  async function handleSyncResults() {
    setSyncingResults(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/matches/sync-results", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMessage({ text: data.message, type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setSyncingResults(false);
    }
  }

  async function handleSyncApiFutebol(rodada: number = 34) {
    if (
      !confirm(
        `⚠️ ATENÇÃO: Esta ação é para IMPORTAR UMA NOVA RODADA COMPLETA e substituir as partidas.\n\nSe você deseja apenas verificar e pontuar os jogos que já terminaram, utilize o botão "Atualizar Resultados dos Jogos (API Futebol)".\n\nDeseja realmente continuar?`
      )
    )
      return;
    setSyncing(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/matches/api-futebol", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ campeonatoId: 10, rodada, onlyUpcoming: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMessage({ text: data.message, type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleAutoSync(feedKey: string) {
    if (!confirm("Deseja sincronizar e substituir as partidas por este pacote oficial de 10 jogos automaticamente?")) return;
    setSyncing(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/matches/sync", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ feedKey, replaceExisting: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMessage({ text: data.message, type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setSyncing(false);
    }
  }

  async function loadData() {
    try {
      const res = await fetch(`/api/admin/overview?_t=${Date.now()}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      const data = await res.json();
      if (data.tournament) {
        setTournament(data.tournament);
        setMatches(data.tournament.matches || []);

        const initialScores: Record<string, { home: string; away: string }> = {};
        data.tournament.matches.forEach((m: MatchItem) => {
          initialScores[m.id] = {
            home: m.homeScore !== null && m.homeScore !== undefined ? String(m.homeScore) : "",
            away: m.awayScore !== null && m.awayScore !== undefined ? String(m.awayScore) : "",
          };
        });
        setScores(initialScores);
      }
    } catch (err) {
      console.error("Erro ao carregar jogos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Salvar placar final e processar pontuações instantaneamente!
  async function handleSaveScore(matchId: string) {
    const score = scores[matchId];
    if (!score || score.home === "" || score.away === "") {
      setStatusMessage({ text: "Preencha os placares de ambos os times.", type: "error" });
      return;
    }

    setSavingScoreId(matchId);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/matches/score", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          matchId,
          homeScore: score.home,
          awayScore: score.away,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar placar.");
      }

      setStatusMessage({
        text: `Placar salvo! Pontuações e ranking recalculados com sucesso. (${data.result?.processedPredictions || 0} palpites processados)`,
        type: "success",
      });

      // Recarrega lista
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setSavingScoreId(null);
    }
  }

  // Cadastrar nova partida
  async function handleAddMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!tournament?.id) return;
    setAddingMatch(true);

    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tournamentId: tournament.id,
          homeTeam: newMatch.homeTeam,
          awayTeam: newMatch.awayTeam,
          stadium: newMatch.stadium,
          matchDate: newMatch.matchDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar partida.");
      }

      setShowAddModal(false);
      setNewMatch({
        homeTeam: "",
        awayTeam: "",
        stadium: "",
        matchDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });

      setStatusMessage({ text: "Partida adicionada à rodada com sucesso!", type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setAddingMatch(false);
    }
  }

  // Excluir partida
  async function handleDeleteMatch(matchId: string) {
    if (!confirm("Tem certeza que deseja remover esta partida da rodada?")) return;

    try {
      const res = await fetch(`/api/admin/matches?id=${matchId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir partida.");
      }

      setStatusMessage({ text: "Partida excluída com sucesso.", type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin mb-3" />
        <p className="text-gray-400 text-xs">Carregando lista de partidas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO COM BOTÕES DE AÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Gestão de Partidas da Rodada</h2>
          <p className="text-xs text-gray-400">
            Sincronize rodadas oficiais automaticamente ou cadastre jogos e digite os placares oficiais.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncResults}
            disabled={syncingResults}
            className="py-2.5 px-3.5 bg-pitch-green hover:bg-pitch-light text-arena-950 font-black rounded-xl text-xs transition shadow-glow flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="Verifica se algum jogo desta rodada encerrou na API Futebol e calcula os pontos e ranking automaticamente"
          >
            {syncingResults ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 text-arena-950" />
                <span>⚡ Atualizar Resultados dos Jogos (API Futebol)</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleSyncApiFutebol(35)}
            disabled={syncing}
            className="py-2.5 px-3.5 bg-gold-500 hover:bg-gold-400 text-arena-950 font-extrabold rounded-xl text-xs transition shadow-goldglow flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="Puxar os 10 confrontos da próxima 35ª Rodada da Série A via API Futebol"
          >
            <span>⚡ API Futebol: Rodada 35</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-3.5 bg-arena-850 hover:bg-arena-800 text-white font-bold rounded-xl text-xs border border-arena-700 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Manual</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-pitch-green/10 border border-pitch-green/30 text-pitch-green"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* LISTA DE JOGOS */}
      <div className="bg-arena-900 border border-arena-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="divide-y divide-arena-800">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhuma partida cadastrada neste bolão. Clique no botão acima para adicionar a primeira.
            </div>
          ) : (
            matches.map((match) => {
              const current = scores[match.id] || { home: "", away: "" };
              const isSaving = savingScoreId === match.id;

              return (
                <div key={match.id} className="p-4 sm:p-5 hover:bg-arena-850/40 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Dados da Partida */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatMatchDate(match.matchDate)}</span>
                        {match.stadium && <span>• {match.stadium}</span>}
                        {match.status === "FINISHED" ? (
                          <span className="px-2 py-0.5 rounded-full bg-pitch-green/10 text-pitch-green font-bold text-[10px] border border-pitch-green/20">
                            Finalizado / Pontuado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-arena-800 text-gray-300 font-bold text-[10px]">
                            Agendado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className="text-right min-w-[90px]">{match.homeTeam}</span>
                        <TeamBadge teamNameOrId={match.homeTeam} size="sm" />
                        <span className="text-gray-500 font-mono text-xs px-1">x</span>
                        <TeamBadge teamNameOrId={match.awayTeam} size="sm" />
                        <span className="text-left min-w-[90px]">{match.awayTeam}</span>
                      </div>
                    </div>

                    {/* Inputs de Placar e Ação de Processamento */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <div className="flex items-center gap-1.5 bg-arena-850 border border-arena-700 p-1 rounded-xl">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={current.home}
                          onChange={(e) =>
                            setScores({
                              ...scores,
                              [match.id]: { ...current, home: e.target.value },
                            })
                          }
                          className="w-10 h-9 bg-arena-900 border border-arena-700 rounded-lg text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-gold-500"
                        />
                        <span className="text-gray-500 text-xs font-bold">x</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={current.away}
                          onChange={(e) =>
                            setScores({
                              ...scores,
                              [match.id]: { ...current, away: e.target.value },
                            })
                          }
                          className="w-10 h-9 bg-arena-900 border border-arena-700 rounded-lg text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>

                      <button
                        onClick={() => handleSaveScore(match.id)}
                        disabled={isSaving}
                        className="py-2.5 px-3.5 bg-pitch-green hover:bg-pitch-light text-arena-950 font-bold text-xs rounded-xl transition shadow-glow flex items-center gap-1.5 disabled:opacity-50"
                        title="Salvar Placar Oficial e Recalcular Pontuações"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Salvar & Processar</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-arena-800 rounded-xl transition"
                        title="Excluir partida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL PARA ADICIONAR NOVA PARTIDA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-arena-900 border border-arena-700 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Cadastrar Nova Partida</h3>
            <p className="text-xs text-gray-400 mb-4">
              Informe os times e a data/horário oficial do jogo.
            </p>

            {/* ATALHOS RÁPIDOS DE JOGOS DA LA LIGA */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gold-400 uppercase tracking-wider mb-1.5">
                ⚡ Preenchimento Rápido (La Liga & Clássicos):
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setNewMatch({
                      ...newMatch,
                      homeTeam: "Real Madrid",
                      awayTeam: "Barcelona",
                      stadium: "Santiago Bernabéu, Madri",
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-arena-800 hover:bg-gold-500 hover:text-arena-950 text-white text-[11px] font-semibold border border-arena-700 transition"
                >
                  🇪🇸 El Clásico (Real x Barça)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setNewMatch({
                      ...newMatch,
                      homeTeam: "Atlético de Madrid",
                      awayTeam: "Sevilla",
                      stadium: "Cívitas Metropolitano, Madri",
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-arena-800 hover:bg-gold-500 hover:text-arena-950 text-white text-[11px] font-semibold border border-arena-700 transition"
                >
                  🇪🇸 Atl. Madrid x Sevilla
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setNewMatch({
                      ...newMatch,
                      homeTeam: "Athletic Bilbao",
                      awayTeam: "Real Sociedad",
                      stadium: "San Mamés, Bilbao",
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-arena-800 hover:bg-gold-500 hover:text-arena-950 text-white text-[11px] font-semibold border border-arena-700 transition"
                >
                  🇪🇸 Bilbao x Real Sociedad
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setNewMatch({
                      ...newMatch,
                      homeTeam: "Real Betis",
                      awayTeam: "Girona",
                      stadium: "Benito Villamarín, Sevilha",
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-arena-800 hover:bg-gold-500 hover:text-arena-950 text-white text-[11px] font-semibold border border-arena-700 transition"
                >
                  🇪🇸 Betis x Girona
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setNewMatch({
                      ...newMatch,
                      homeTeam: "Villarreal",
                      awayTeam: "Valencia",
                      stadium: "Estadio de la Cerámica",
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-arena-800 hover:bg-gold-500 hover:text-arena-950 text-white text-[11px] font-semibold border border-arena-700 transition"
                >
                  🇪🇸 Villarreal x Valencia
                </button>
              </div>
            </div>

            <form onSubmit={handleAddMatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Time Mandante (Casa)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Real Madrid"
                  value={newMatch.homeTeam}
                  onChange={(e) => setNewMatch({ ...newMatch, homeTeam: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Time Visitante (Fora)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barcelona"
                  value={newMatch.awayTeam}
                  onChange={(e) => setNewMatch({ ...newMatch, awayTeam: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Estádio / Local (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Santiago Bernabéu, Madri"
                  value={newMatch.stadium}
                  onChange={(e) => setNewMatch({ ...newMatch, stadium: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Data e Horário do Jogo
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newMatch.matchDate}
                  onChange={(e) => setNewMatch({ ...newMatch, matchDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-arena-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingMatch}
                  className="py-2.5 px-5 bg-gold-500 hover:bg-gold-400 text-arena-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  {addingMatch ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Adicionar Partida</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
