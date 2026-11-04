"use client";
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Zap,
  Phone,
  Mail,
  Plus,
  Minus,
  Trash2,
  Unlock,
  Edit,
  Award,
  X,
  Save,
  Shield,
  RotateCcw,
  Eye,
  Trophy,
  Target,
} from "lucide-react";
import { BRAZILIAN_TEAMS, getTeamByName } from "@/lib/teams";
import { TeamBadge } from "@/components/TeamBadge";
import { formatMatchDate } from "@/lib/dateUtils";

interface PredictionItem {
  id: string;
  homeScore: number;
  awayScore: number;
  pointsEarned: number;
  scoreType: string;
  isLocked: boolean;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number | null;
    awayScore?: number | null;
    matchDate: string;
    status: string;
  };
}

interface ParticipantItem {
  id: string;
  paymentStatus: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  totalPoints: number;
  exactScoresCount: number;
  rankPosition?: number | null;
  paidAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string | null;
    favoriteTeam?: string | null;
  };
  predictions?: PredictionItem[];
}

export default function AdminParticipantesPage() {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal de edição detalhada
  const [editingParticipant, setEditingParticipant] = useState<ParticipantItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFavoriteTeam, setEditFavoriteTeam] = useState("");
  const [editPoints, setEditPoints] = useState(0);
  const [editExacts, setEditExacts] = useState(0);
  const [editSaving, setEditSaving] = useState(false);

  // Modal de visualização de palpites do jogador
  const [viewingPredictionsParticipant, setViewingPredictionsParticipant] = useState<ParticipantItem | null>(null);

  async function loadData() {
    try {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
      const res = await fetch(`/api/admin/overview?_t=${Date.now()}`, {
        headers: localToken ? { Authorization: `Bearer ${localToken}` } : {},
        cache: "no-store",
      });
      const data = await res.json();
      if (data.tournament) {
        setParticipants(data.tournament.participants || []);
      }
    } catch (err) {
      console.error("Erro ao carregar participantes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getAuthHeaders() {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
    return {
      "Content-Type": "application/json",
      ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
    };
  }

  // Alterar Pontos Rápido (+5, +1, -1, -5)
  async function handleQuickPoints(participantId: string, delta: number) {
    setActionLoadingId(participantId);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/participants/manage", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          participantId,
          action: "UPDATE_POINTS",
          delta,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage({ text: data.message, type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Destravar Palpites para o jogador poder editar novamente
  async function handleUnlockPredictions(participantId: string, userName: string) {
    if (!confirm(`Deseja DESTRAVAR os palpites de ${userName}? O jogador poderá editar os palpites na tela dele antes do início dos jogos.`)) {
      return;
    }

    setActionLoadingId(participantId);
    try {
      const res = await fetch("/api/admin/participants/manage", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          participantId,
          action: "RESET_PREDICTIONS",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage({ text: data.message, type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Zerar Todos os Pontos e Cravadas da Rodada
  async function handleResetAllPoints() {
    if (participants.length === 0) return;
    if (
      !confirm(
        "⚠️ TEM CERTEZA que deseja ZERAR todos os pontos e cravadas de TODOS os participantes da rodada? Todos voltarão para 0 pontos para início limpo."
      )
    ) {
      return;
    }

    const firstId = participants[0].id;
    setActionLoadingId("ALL");
    try {
      const res = await fetch("/api/admin/participants/manage", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          participantId: firstId,
          action: "RESET_ALL_POINTS",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage({ text: data.message, type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Excluir participante do bolão
  async function handleDeleteParticipant(participantId: string, userName: string) {
    if (!confirm(`ATENÇÃO: Deseja realmente EXCLUIR o participante ${userName} do bolão? Todos os seus palpites serão removidos e o ranking será reordenado.`)) {
      return;
    }

    setActionLoadingId(participantId);
    try {
      const res = await fetch("/api/admin/participants/manage", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          participantId,
          action: "DELETE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage({ text: data.message, type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Salvar Edição Detalhada do Modal (Nome, E-mail, Telefone, Time e Pontos)
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingParticipant) return;
    setEditSaving(true);

    try {
      const res = await fetch("/api/admin/participants/manage", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          participantId: editingParticipant.id,
          action: "UPDATE_USER_DATA",
          userData: {
            name: editName,
            email: editEmail,
            phone: editPhone,
            favoriteTeam: editFavoriteTeam || null,
            totalPoints: editPoints,
            exactScoresCount: editExacts,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações.");

      setStatusMessage({
        text: data.message || `Dados e pontuação de ${editName} atualizados com sucesso!`,
        type: "success",
      });

      setEditingParticipant(null);
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setEditSaving(false);
    }
  }

  // Aprovação Manual para Contingência Pix
  async function handleManualApprove(participantId: string, userName: string) {
    if (!confirm(`Deseja aprovar MANUALMENTE o participante ${userName}? Essa ação liberará o envio de palpites imediatamente.`)) {
      return;
    }

    setActionLoadingId(participantId);
    try {
      const res = await fetch("/api/admin/participants/approve", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ participantId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao aprovar participante.");

      setStatusMessage({ text: data.message || `Participante ${userName} aprovado com sucesso!`, type: "success" });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  const filtered = participants.filter((p) => {
    if (filter === "PAID" && p.paymentStatus !== "PAID") return false;
    if (filter === "PENDING" && p.paymentStatus !== "PENDING") return false;

    if (search.trim()) {
      const term = search.toLowerCase();
      const name = p.user.name.toLowerCase();
      const email = p.user.email.toLowerCase();
      const phone = p.user.phone.toLowerCase();
      return name.includes(term) || email.includes(term) || phone.includes(term);
    }

    return true;
  });

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin mb-3" />
        <p className="text-gray-400 text-xs">Carregando gestão de clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-500" />
            <span>Gestão Completa de Clientes & Pontuações</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Controle total: aumente/diminua pontos, destrave palpites, altere status de pagamento e exclua participantes.
          </p>
        </div>

        {participants.length > 0 && (
          <button
            onClick={handleResetAllPoints}
            disabled={actionLoadingId === "ALL"}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto disabled:opacity-50"
            title="Zerar todos os pontos e cravadas da classificação geral para início limpo"
          >
            <RotateCcw className={`w-4 h-4 ${actionLoadingId === "ALL" ? "animate-spin" : ""}`} />
            <span>Zerar Todos os Pontos da Geral</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in ${
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

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Barra de Busca */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-arena-900 border border-arena-800 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-gold-500"
          />
        </div>

        {/* Abas de Filtro */}
        <div className="flex items-center gap-1.5 bg-arena-900 border border-arena-800 p-1 rounded-xl">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "ALL" ? "bg-arena-800 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Todos ({participants.length})
          </button>
          <button
            onClick={() => setFilter("PAID")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "PAID" ? "bg-pitch-green/20 text-pitch-green" : "text-gray-400 hover:text-white"
            }`}
          >
            Inscritos ({participants.filter((p) => p.paymentStatus === "PAID").length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "PENDING" ? "bg-gold-500/20 text-gold-400" : "text-gray-400 hover:text-white"
            }`}
          >
            Pendentes ({participants.filter((p) => p.paymentStatus === "PENDING").length})
          </button>
        </div>
      </div>

      {/* TABELA DE PARTICIPANTES COM CONTROLES */}
      <div className="bg-arena-900 border border-arena-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-arena-850/80 border-b border-arena-800 text-gray-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Pos / Jogador</th>
                <th className="px-4 py-3">Contato WhatsApp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pontos & Cravadas</th>
                <th className="px-4 py-3 text-center">Ajuste Rápido (+ / -)</th>
                <th className="px-4 py-3 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum participante encontrado com o filtro atual.
                  </td>
                </tr>
              ) : (
                filtered.map((part) => {
                  const isPaid = part.paymentStatus === "PAID";
                  const isBusy = actionLoadingId === part.id;

                  return (
                    <tr key={part.id} className="hover:bg-arena-850/40 transition">
                      {/* Posição e Nome */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-arena-800 text-gold-400 font-bold font-mono flex items-center justify-center text-xs">
                            {part.rankPosition || "-"}º
                          </span>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{part.user.name}</span>
                              {part.user.favoriteTeam && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-arena-800 border border-arena-700 text-[10px] text-gray-300 font-medium">
                                  ⚽ {part.user.favoriteTeam}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              Cadastrado em {new Date(part.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contato WhatsApp */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-200 font-medium">
                          <Phone className="w-3.5 h-3.5 text-pitch-green" />
                          <span>{part.user.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span className="truncate max-w-[140px]">{part.user.email}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pitch-green/10 border border-pitch-green/30 text-pitch-green font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Aprovado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleManualApprove(part.id, part.user.name)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500/10 hover:bg-gold-500 hover:text-arena-950 border border-gold-500/30 text-gold-400 font-bold text-[11px] transition"
                            title="Clique para Aprovar Manualmente"
                          >
                            <Zap className="w-3 h-3" /> Aprovar Vaga
                          </button>
                        )}
                      </td>

                      {/* Pontuação e Cravadas */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="text-sm font-extrabold text-pitch-green">
                          {part.totalPoints} pts
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {part.exactScoresCount} cravadas
                        </div>
                      </td>

                      {/* Ajuste Rápido de Pontos */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 bg-arena-850 p-1 rounded-xl border border-arena-750">
                          <button
                            onClick={() => handleQuickPoints(part.id, -5)}
                            disabled={isBusy}
                            className="px-2 py-1 rounded bg-arena-800 hover:bg-red-500/20 hover:text-red-400 text-gray-300 font-bold text-xs transition"
                            title="Diminuir 5 pontos"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleQuickPoints(part.id, -1)}
                            disabled={isBusy}
                            className="px-2 py-1 rounded bg-arena-800 hover:bg-red-500/20 hover:text-red-400 text-gray-300 font-bold text-xs transition"
                            title="Diminuir 1 ponto"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleQuickPoints(part.id, 1)}
                            disabled={isBusy}
                            className="px-2 py-1 rounded bg-arena-800 hover:bg-pitch-green/20 hover:text-pitch-green text-gray-300 font-bold text-xs transition"
                            title="Aumentar 1 ponto"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleQuickPoints(part.id, 5)}
                            disabled={isBusy}
                            className="px-2 py-1 rounded bg-arena-800 hover:bg-pitch-green/20 hover:text-pitch-green text-gray-300 font-bold text-xs transition"
                            title="Aumentar 5 pontos"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Ações Avançadas */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Visualizar Palpites */}
                          <button
                            onClick={() => setViewingPredictionsParticipant(part)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/25 text-gold-400 border border-gold-500/30 text-xs font-bold transition shadow-sm"
                            title="Visualizar Palpites deste Participante"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Palpites</span>
                            {part.predictions && part.predictions.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-gold-500 text-arena-950 text-[10px] font-black">
                                {part.predictions.length}
                              </span>
                            )}
                          </button>

                          {/* Editar no modal */}
                          <button
                            onClick={() => {
                              setEditingParticipant(part);
                              setEditName(part.user.name);
                              setEditEmail(part.user.email);
                              setEditPhone(part.user.phone);
                              setEditFavoriteTeam(part.user.favoriteTeam || "");
                              setEditPoints(part.totalPoints);
                              setEditExacts(part.exactScoresCount);
                            }}
                            className="p-2 text-gray-300 hover:text-gold-400 hover:bg-arena-800 rounded-lg transition"
                            title="Editar Dados e Pontos do Cliente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Destravar Palpites */}
                          <button
                            onClick={() => handleUnlockPredictions(part.id, part.user.name)}
                            disabled={isBusy}
                            className="p-2 text-gray-300 hover:text-pitch-green hover:bg-arena-800 rounded-lg transition"
                            title="Destravar Palpites (permitir ao jogador editar)"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>

                          {/* Excluir Participante */}
                          <button
                            onClick={() => handleDeleteParticipant(part.id, part.user.name)}
                            disabled={isBusy}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-arena-800 rounded-lg transition"
                            title="Excluir Participante do Bolão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DETALHADA DO CLIENTE */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-arena-900 border border-arena-700 rounded-3xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setEditingParticipant(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-arena-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Edit className="w-5 h-5 text-gold-500" />
              <span>Editar Participante & Dados do Cliente</span>
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Altere os dados cadastrais (Nome, E-mail, WhatsApp, Time do Coração) e ajuste a pontuação manual com recálculo automático do ranking.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    WhatsApp (com DDD)
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  E-mail do Jogador
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Time do Coração */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Time do Coração (Brasileirão / Clubes)
                </label>
                <select
                  value={editFavoriteTeam}
                  onChange={(e) => setEditFavoriteTeam(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-gold-500"
                >
                  <option value="">Nenhum time selecionado</option>
                  {BRAZILIAN_TEAMS.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.initials})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-arena-800">
                <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider block mb-2">
                  Ajuste Manual de Desempenho no Bolão
                </span>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Pontos Totais
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editPoints}
                      onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-arena-850 border border-arena-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Cravadas (Placares Exatos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editExacts}
                      onChange={(e) => setEditExacts(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-arena-850 border border-arena-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-pitch-green"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-arena-800">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="py-2.5 px-4 text-xs font-semibold text-gray-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="py-2.5 px-5 bg-gold-500 hover:bg-gold-400 text-arena-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-goldglow transition active:scale-95"
                >
                  {editSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Todas Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE PALPITES DO JOGADOR */}
      {viewingPredictionsParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-arena-900 border border-arena-700 rounded-3xl p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            {/* Botão Fechar Topo */}
            <button
              onClick={() => setViewingPredictionsParticipant(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-arena-800 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="mb-4 pr-10">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-5 h-5 text-gold-500" />
                <h3 className="text-lg font-bold text-white">
                  Palpites de {viewingPredictionsParticipant.user.name}
                </h3>
              </div>
              <p className="text-xs text-gray-400 flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-gray-300">
                  <Phone className="w-3 h-3 text-pitch-green" /> {viewingPredictionsParticipant.user.phone}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Mail className="w-3 h-3 text-gray-500" /> {viewingPredictionsParticipant.user.email}
                </span>
                {viewingPredictionsParticipant.user.favoriteTeam && (
                  <span className="px-2 py-0.5 rounded bg-arena-800 border border-arena-700 text-gray-300 text-[11px] font-semibold">
                    ⚽ {viewingPredictionsParticipant.user.favoriteTeam}
                  </span>
                )}
              </p>
            </div>

            {/* Resumo de Desempenho */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-arena-850 border border-arena-800 mb-4 shrink-0">
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-gray-400">Palpites Registrados</span>
                <span className="text-lg font-black text-white font-mono">
                  {viewingPredictionsParticipant.predictions?.length || 0}
                </span>
              </div>
              <div className="text-center border-x border-arena-750">
                <span className="block text-[10px] uppercase font-bold text-gold-400">Pontuação Total</span>
                <span className="text-lg font-black text-pitch-green font-mono">
                  {viewingPredictionsParticipant.totalPoints} pts
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-pitch-green">Placares Exatos</span>
                <span className="text-lg font-black text-gold-400 font-mono">
                  {viewingPredictionsParticipant.exactScoresCount} cravadas
                </span>
              </div>
            </div>

            {/* Lista com scroll dos palpites */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar">
              {!viewingPredictionsParticipant.predictions || viewingPredictionsParticipant.predictions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-arena-850/50 border border-arena-800 text-center text-gray-400 text-xs">
                  <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-300">Nenhum palpite enviado ainda</p>
                  <p className="mt-1 text-gray-500">Este participante ainda não enviou palpites para os jogos desta rodada.</p>
                </div>
              ) : (
                viewingPredictionsParticipant.predictions.map((pred) => {
                  const isFinished = pred.match.status === "FINISHED";
                  const isExact = pred.pointsEarned === 10;
                  const isWinner = pred.pointsEarned === 5;
                  const isGoalDiff = pred.pointsEarned === 2;

                  return (
                    <div
                      key={pred.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isExact
                          ? "bg-pitch-green/5 border-pitch-green/40 shadow-sm"
                          : isWinner || isGoalDiff
                          ? "bg-gold-500/5 border-gold-500/30"
                          : "bg-arena-850 border-arena-800"
                      }`}
                    >
                      {/* Linha superior: Data do jogo e Status */}
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                        <span className="font-medium text-gray-300">
                          {formatMatchDate(pred.match.matchDate)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isFinished ? (
                            <span className="px-2 py-0.5 rounded-full bg-pitch-green/10 text-pitch-green text-[10px] font-bold border border-pitch-green/30">
                              Partida Encerrada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-arena-800 text-gray-400 text-[10px] font-medium">
                              Agendado
                            </span>
                          )}
                          {pred.isLocked ? (
                            <span className="px-1.5 py-0.5 rounded bg-arena-800 text-gray-400 text-[10px]">
                              🔒 Trancado
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-pitch-green/10 text-pitch-green text-[10px]">
                              ⏳ Aberto
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Confronto dos Clubes com os Escudos e Palpite */}
                      <div className="flex items-center justify-between gap-2 py-1">
                        {/* Mandante */}
                        <div className="flex items-center gap-2.5 flex-1 justify-end text-right">
                          <span className="font-bold text-white text-xs sm:text-sm truncate">
                            {pred.match.homeTeam}
                          </span>
                          <TeamBadge teamNameOrId={pred.match.homeTeam} size="md" />
                        </div>

                        {/* Palpite do Usuário */}
                        <div className="flex flex-col items-center px-3 py-1.5 bg-arena-950/80 rounded-xl border border-gold-500/30 shrink-0">
                          <span className="text-[9px] uppercase tracking-wider text-gold-400 font-bold">
                            Palpite
                          </span>
                          <div className="font-mono font-extrabold text-white text-base flex items-center gap-1.5">
                            <span className="text-gold-400">{pred.homeScore}</span>
                            <span className="text-gray-500 text-xs">x</span>
                            <span className="text-gold-400">{pred.awayScore}</span>
                          </div>
                        </div>

                        {/* Visitante */}
                        <div className="flex items-center gap-2.5 flex-1 justify-start text-left">
                          <TeamBadge teamNameOrId={pred.match.awayTeam} size="md" />
                          <span className="font-bold text-white text-xs sm:text-sm truncate">
                            {pred.match.awayTeam}
                          </span>
                        </div>
                      </div>

                      {/* Linha inferior: Placar Oficial e Pontos Obtidos */}
                      <div className="mt-2.5 pt-2 border-t border-arena-800/80 flex items-center justify-between text-xs">
                        <div className="text-gray-400">
                          {isFinished ? (
                            <span className="font-medium">
                              Placar Oficial: <strong className="text-white font-mono">{pred.match.homeScore} x {pred.match.awayScore}</strong>
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-500">Aguardando início do jogo</span>
                          )}
                        </div>

                        <div>
                          {isFinished ? (
                            isExact ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pitch-green/20 text-pitch-green font-black text-[11px] border border-pitch-green/40 shadow-glow">
                                🎯 +10 PTS (Placar Exato)
                              </span>
                            ) : isWinner ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 font-black text-[11px] border border-gold-500/40">
                                ⚡ +5 PTS (Vencedor)
                              </span>
                            ) : isGoalDiff ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-black text-[11px] border border-blue-500/40">
                                ⚽ +2 PTS (Saldo/Gols)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-arena-800 text-gray-400 font-bold text-[11px]">
                                0 pts
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-gray-500">
                              Pontuação pendente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-4 mt-3 border-t border-arena-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-gray-500">
                Visualização oficial de conferência pelo administrador.
              </span>
              <button
                type="button"
                onClick={() => setViewingPredictionsParticipant(null)}
                className="py-2 px-5 bg-arena-800 hover:bg-arena-750 text-white font-bold text-xs rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
