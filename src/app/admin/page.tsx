"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Users,
  Trophy,
  Calendar,
  Send,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadOverview() {
    try {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("bolao_admin_token") : null;
      const res = await fetch(`/api/admin/overview?_t=${Date.now()}`, {
        headers: localToken ? { Authorization: `Bearer ${localToken}` } : {},
        cache: "no-store",
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin mb-3" />
        <p className="text-gray-400 text-xs">Carregando métricas em tempo real...</p>
      </div>
    );
  }

  const { metrics, tournament } = data || {};

  return (
    <div className="space-y-6">
      {/* 4 CARDS DE MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Arrecadado Pix */}
        <div className="bg-arena-900 border border-arena-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-2">
            <span>Arrecadação Pix</span>
            <div className="p-2 rounded-xl bg-pitch-green/10 text-pitch-green">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            R$ {(metrics?.totalCollected || 0).toFixed(2).replace(".", ",")}
          </div>
          <span className="text-[11px] text-pitch-green font-semibold mt-1 block">
            {metrics?.paidParticipantsCount || 0} inscrições pagas
          </span>
        </div>

        {/* Total de Usuários Inscritos */}
        <div className="bg-arena-900 border border-arena-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-2">
            <span>Inscritos no Bolão</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {metrics?.totalParticipants || 0}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Total na base: {metrics?.totalUsers || 0} contas
          </span>
        </div>

        {/* Palpites Computados */}
        <div className="bg-arena-900 border border-arena-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-2">
            <span>Palpites Registrados</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {metrics?.totalPredictions || 0}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Processamento automático</span>
        </div>

        {/* Partidas Finalizadas */}
        <div className="bg-arena-900 border border-arena-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-2">
            <span>Jogos Processados</span>
            <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {metrics?.finishedMatches || 0} / {metrics?.totalMatches || 0}
          </div>
          <span className="text-[11px] text-gold-400 font-semibold mt-1 block">
            {(metrics?.totalMatches || 0) - (metrics?.finishedMatches || 0)} pendentes de placar
          </span>
        </div>
      </div>

      {/* STATUS DO BOLÃO ATIVO */}
      {tournament ? (
        <div className="bg-arena-900 border border-arena-800 rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-arena-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-pitch-green/20 text-pitch-green text-xs font-bold uppercase">
                  Bolão Ativo no Momento
                </span>
                <span className="text-xs text-gray-400">
                  {tournament.type === "ROUND_WEEKLY" ? "Por Rodada (Semanal)" : "Liga Mensal"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{tournament.title}</h2>
            </div>

            <Link
              href="/admin/bolao"
              className="py-2 px-4 bg-arena-800 hover:bg-arena-750 text-white text-xs font-bold rounded-xl border border-arena-700 transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <span>Editar Configurações</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-arena-850 p-3 rounded-xl border border-arena-750">
              <span className="text-gray-400 block mb-0.5">Entrada Pix:</span>
              <span className="text-white font-bold font-mono text-sm">
                R$ {tournament.entryFee.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <div className="bg-arena-850 p-3 rounded-xl border border-arena-750">
              <span className="text-gray-400 block mb-0.5">Prêmio Estimado:</span>
              <span className="text-gold-400 font-bold font-mono text-sm">
                R$ {tournament.prizePool.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <div className="bg-arena-850 p-3 rounded-xl border border-arena-750">
              <span className="text-gray-400 block mb-0.5">Placar Exato:</span>
              <span className="text-pitch-green font-bold font-mono text-sm">
                {tournament.exactScorePoints} pontos
              </span>
            </div>

            <div className="bg-arena-850 p-3 rounded-xl border border-arena-750">
              <span className="text-gray-400 block mb-0.5">Vencedor / Empate:</span>
              <span className="text-white font-bold font-mono text-sm">
                {tournament.winnerPoints} pontos
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-arena-900 border border-arena-800 rounded-3xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gold-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-white mb-1">Nenhum Bolão Ativo</h2>
          <p className="text-xs text-gray-400 mb-4">
            Crie e ative um novo bolão para começar a receber inscrições e palpites.
          </p>
          <Link
            href="/admin/bolao"
            className="py-2.5 px-5 bg-gold-500 text-arena-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
          >
            <span>Configurar Novo Bolão</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ATALHOS RÁPIDOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/jogos"
          className="bg-arena-900 border border-arena-800 hover:border-gold-500/50 rounded-2xl p-5 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-base group-hover:text-gold-400 transition">
              Gerenciar Partidas & Inserir Placares
            </h3>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-gray-400">
            Cadastre jogos da rodada e insira os placares finais para disparar o recálculo automático de todos os palpites e ranking.
          </p>
        </Link>

        <Link
          href="/admin/participantes"
          className="bg-arena-900 border border-arena-800 hover:border-pitch-green/50 rounded-2xl p-5 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-base group-hover:text-pitch-green transition">
              Inscritos & Contingência de Pix
            </h3>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-pitch-green group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-gray-400">
            Monitore pagamentos Pix aprovados e libere manualmente participantes em casos de contingência.
          </p>
        </Link>
      </div>
    </div>
  );
}
