"use client";
import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  DollarSign,
  Calendar,
  Award,
} from "lucide-react";

export default function AdminBolaoConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: "",
    title: "Brasileirão 2026 - Rodada 10",
    type: "ROUND_WEEKLY", // ROUND_WEEKLY | MONTHLY_LEAGUE
    entryFee: 10,
    prizePool: 500,
    prizeDescription: "1º Lugar leva 70% | 2º Lugar leva 20% | 3º Lugar leva 10%",
    exactScorePoints: 10,
    winnerPoints: 5,
    goalDiffPoints: 2,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    deadlinePredictions: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  });

  async function loadActiveTournament() {
    try {
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (data.tournament) {
        const t = data.tournament;
        setForm({
          id: t.id,
          title: t.title,
          type: t.type,
          entryFee: t.entryFee,
          prizePool: t.prizePool,
          prizeDescription: t.prizeDescription || "",
          exactScorePoints: t.exactScorePoints,
          winnerPoints: t.winnerPoints,
          goalDiffPoints: t.goalDiffPoints,
          startDate: new Date(t.startDate).toISOString().slice(0, 16),
          endDate: new Date(t.endDate).toISOString().slice(0, 16),
          deadlinePredictions: new Date(t.deadlinePredictions).toISOString().slice(0, 16),
          isActive: t.isActive,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar configurações do bolão:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActiveTournament();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
      const res = await fetch("/api/admin/tournament", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar bolão.");
      }

      setSuccess("Configurações do bolão atualizadas com sucesso!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin mb-3" />
        <p className="text-gray-400 text-xs">Carregando formulário de configuração...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="bg-arena-900 border border-arena-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-arena-800">
          <div className="p-3 bg-gold-500/10 text-gold-400 rounded-2xl border border-gold-500/20">
            <Settings className="w-6 h-6 text-gold-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Configuração da Dinâmica do Bolão</h2>
            <p className="text-xs text-gray-400">
              Defina o formato de disputa, valores do Pix, premiação e regras de pontuação
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-pitch-green/10 border border-pitch-green/30 rounded-2xl text-pitch-green text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. INFORMAÇÕES BÁSICAS E FORMATO */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold-500" />
              <span>1. Formato da Competição</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Título do Bolão
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Brasileirão 2026 - Rodada 10"
                  className="w-full px-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Tipo de Disputa
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500 transition"
                >
                  <option value="ROUND_WEEKLY">Por Rodada (Semanal)</option>
                  <option value="MONTHLY_LEAGUE">Liga Mensal Acumulada</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. REGRAS FINANCEIRAS E PREMIAÇÃO */}
          <div className="space-y-4 pt-4 border-t border-arena-800">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-pitch-green" />
              <span>2. Valores Financeiros e Premiação</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Valor do Ingresso Pix (R$)
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={form.entryFee}
                  onChange={(e) => setForm({ ...form, entryFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-pitch-green transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {form.entryFee === 0 ? (
                    <span className="text-pitch-green font-bold">
                      🎁 Modo Gratuito Ativo (Ideal para captação massiva de contatos no Instagram)
                    </span>
                  ) : (
                    <span>Defina 0 para rodada grátis ou ex: R$ 5,00, R$ 10,00, R$ 20,00</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Valor Estimado do Prêmio (R$)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  required
                  value={form.prizePool}
                  onChange={(e) => setForm({ ...form, prizePool: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-gold-400 font-mono font-bold text-sm focus:outline-none focus:border-gold-500 transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">Ex: R$ 200, R$ 500 ou % acumulada</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Regra de Distribuição do Prêmio
              </label>
              <input
                type="text"
                value={form.prizeDescription}
                onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })}
                placeholder="Ex: 1º Lugar: 70% | 2º Lugar: 20% | 3º Lugar: 10%"
                className="w-full px-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500 transition"
              />
            </div>
          </div>

          {/* 3. REGRAS DE PONTUAÇÃO */}
          <div className="space-y-4 pt-4 border-t border-arena-800">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-gold-500" />
              <span>3. Regras de Pontuação dos Palpites</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Placar Exato (pts)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.exactScorePoints}
                  onChange={(e) => setForm({ ...form, exactScorePoints: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-pitch-green font-mono font-bold text-sm focus:outline-none focus:border-pitch-green transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">Padrão sugerido: 10 pts</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Vencedor / Empate (pts)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.winnerPoints}
                  onChange={(e) => setForm({ ...form, winnerPoints: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-white transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">Padrão sugerido: 5 pts</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Saldo de Gols Bônus (pts)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.goalDiffPoints}
                  onChange={(e) => setForm({ ...form, goalDiffPoints: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-arena-850 border border-arena-700 rounded-xl text-gold-400 font-mono font-bold text-sm focus:outline-none focus:border-gold-500 transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">Padrão sugerido: 2 pts</p>
              </div>
            </div>
          </div>

          {/* 4. DATAS E PRAZOS */}
          <div className="space-y-4 pt-4 border-t border-arena-800">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>4. Datas e Prazo Limite para Palpites</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Limite Geral de Palpites
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.deadlinePredictions}
                  onChange={(e) => setForm({ ...form, deadlinePredictions: e.target.value })}
                  className="w-full px-3 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500 transition"
                />
                <p className="text-[11px] text-gold-400 mt-1">Data/hora em que as apostas fecham</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Data de Início
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Data de Término
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-3 bg-arena-850 border border-arena-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-arena-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-gold-500 hover:bg-gold-400 text-arena-950 font-black text-sm rounded-xl transition shadow-goldglow flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações do Bolão</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
