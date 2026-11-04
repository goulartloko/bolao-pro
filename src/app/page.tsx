import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CountdownTimer from "@/components/CountdownTimer";
import { formatMatchDate } from "@/lib/dateUtils";
import {
  Trophy,
  Zap,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  Users,
  Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Busca o bolão ativo
  let tournament: any = null;
  let matches: any[] = [];
  let topParticipants: any[] = [];

  try {
    tournament = await prisma.tournament.findFirst({
      where: { isActive: true },
      include: {
        matches: {
          orderBy: { matchDate: "asc" },
        },
        participants: {
          where: { paymentStatus: "PAID" },
          include: { user: true },
          orderBy: [
            { totalPoints: "desc" },
            { exactScoresCount: "desc" },
            { createdAt: "asc" },
          ],
          take: 5,
        },
      },
    });

    if (tournament) {
      matches = tournament.matches;
      topParticipants = tournament.participants;
    }
  } catch (err) {
    console.error("Banco ainda não inicializado ou inacessível:", err);
  }

  // Dados oficiais de fallback caso necessário
  const activeTournament = tournament || {
    id: "demo-tournament",
    title: "Super Quarta dos Campeões - Brasileirão & Champions League",
    type: "ROUND_WEEKLY",
    prizePool: 500,
    entryFee: 0,
    deadlinePredictions: "2026-11-04T16:59:00-03:00",
    exactScorePoints: 10,
    winnerPoints: 5,
    goalDiffPoints: 2,
    prizeDescription: "1º Lugar leva R$ 350,00 no Pix | 2º Lugar leva R$ 100,00 | 3º Lugar leva R$ 50,00",
  };

  const displayMatches = matches.length > 0 ? matches : [
    {
      id: "m1",
      homeTeam: "Slavia Praga",
      awayTeam: "Arsenal",
      stadium: "Eden Arena, Praga (Champions League)",
      matchDate: new Date("2026-11-04T17:00:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m2",
      homeTeam: "Borussia Dortmund",
      awayTeam: "Real Betis",
      stadium: "Signal Iduna Park, Dortmund (Champions League)",
      matchDate: new Date("2026-11-04T17:00:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m3",
      homeTeam: "Inter de Milão",
      awayTeam: "Bayern de Munique",
      stadium: "San Siro, Milão (Champions League)",
      matchDate: new Date("2026-11-04T17:00:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m4",
      homeTeam: "Paris Saint-Germain",
      awayTeam: "Atlético de Madrid",
      stadium: "Parc des Princes, Paris (Champions League)",
      matchDate: new Date("2026-11-04T17:00:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m5",
      homeTeam: "Flamengo",
      awayTeam: "Grêmio",
      stadium: "Estádio do Maracanã, Rio de Janeiro (Brasileirão Série A)",
      matchDate: new Date("2026-11-04T19:30:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m6",
      homeTeam: "Athletico-PR",
      awayTeam: "Vasco",
      stadium: "Ligga Arena, Curitiba (Brasileirão Série A)",
      matchDate: new Date("2026-11-04T19:30:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m7",
      homeTeam: "Cruzeiro",
      awayTeam: "Fluminense",
      stadium: "Estádio Mineirão, Belo Horizonte (Brasileirão Série A)",
      matchDate: new Date("2026-11-04T20:00:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m8",
      homeTeam: "Palmeiras",
      awayTeam: "Internacional",
      stadium: "Allianz Parque, São Paulo (Brasileirão Série A)",
      matchDate: new Date("2026-11-04T21:30:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m9",
      homeTeam: "Botafogo",
      awayTeam: "Atlético-MG",
      stadium: "Estádio Nilton Santos, Rio de Janeiro (Brasileirão Série A)",
      matchDate: new Date("2026-11-04T21:30:00-03:00"),
      status: "SCHEDULED",
    },
    {
      id: "m10",
      homeTeam: "São Paulo",
      awayTeam: "Corinthians",
      stadium: "MorumBIS, São Paulo (Clássico Majestoso - Brasileirão)",
      matchDate: new Date("2026-11-04T21:30:00-03:00"),
      status: "SCHEDULED",
    },
  ];

  return (
    <div className="min-h-screen bg-arena-950 text-slate-100 pitch-cyber-grid">
      {/* HERO SECTION DE ALTO IMPACTO */}
      <section className="relative overflow-hidden bg-arena-radial pt-8 pb-14 px-4 border-b border-arena-800/80">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge de tipo de rodada */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pitch-green/10 border border-pitch-green/40 text-pitch-green text-xs font-black uppercase tracking-wider mb-4 animate-neon-pulse shadow-glow">
            <Flame className="w-4 h-4 text-pitch-green animate-bounce" />
            <span>
              {activeTournament.entryFee === 0
                ? "🎁 EDIÇÃO DE LANÇAMENTO: 100% GRÁTIS!"
                : "⚽ RODADA OFICIAL DA SEMANA"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4">
            <span className="gradient-text-pitch">{activeTournament.title}</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed">
            {activeTournament.entryFee === 0
              ? `Sem custo de inscrição! Cadastre-se em segundos, crave seus palpites nos jogos decisivos de amanhã do Brasileirão e da Champions League e concorra a R$ ${activeTournament.prizePool.toFixed(2).replace(".", ",")} no Pix!`
              : `Aposte no seu conhecimento de futebol, acompanhe seus pontos em tempo real e concorra ao prêmio de R$ ${activeTournament.prizePool.toFixed(2).replace(".", ",")} com pagamento instantâneo no Pix!`}
          </p>

          {/* BARRA DE PREENCHIMENTO DE VAGAS PROMOCIONAIS */}
          {activeTournament.entryFee === 0 && (
            <div className="max-w-md mx-auto mb-8 bg-arena-900/90 border border-pitch-green/30 p-3 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pitch-green" />
                  <span>Vagas Gratuitas Disponíveis</span>
                </span>
                <span className="text-pitch-green font-mono">89% Preenchido</span>
              </div>
              <div className="w-full bg-arena-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-pitch-dark via-pitch-green to-pitch-light h-full w-[89%] rounded-full shadow-glow" />
              </div>
            </div>
          )}

          {/* CARDS DE DESTAQUE: PRÊMIO, INSCRIÇÃO E CRONÔMETRO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto mb-8">
            {/* Prêmio */}
            <div className="glass-card rounded-3xl p-5 relative overflow-hidden flex flex-col items-center justify-center border-gold-500/30 shadow-goldglow">
              <div className="flex items-center gap-1.5 text-gold-400 text-xs font-black uppercase tracking-wider mb-1">
                <Trophy className="w-4 h-4 text-gold-500" />
                <span>Prêmio do 1º Lugar</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                R$ {activeTournament.prizePool.toFixed(2).replace(".", ",")}
              </div>
              <span className="text-[11px] text-gold-400/90 font-semibold mt-0.5">Pagamento 100% no Pix</span>
            </div>

            {/* Inscrição */}
            <div className="glass-card rounded-3xl p-5 relative overflow-hidden flex flex-col items-center justify-center border-pitch-green/40 shadow-glow">
              <div className="flex items-center gap-1.5 text-pitch-green text-xs font-black uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4 text-pitch-green" />
                <span>Entrada no Bolão</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-pitch-green tracking-tight font-mono">
                {activeTournament.entryFee === 0
                  ? "GRÁTIS"
                  : `R$ ${activeTournament.entryFee.toFixed(2).replace(".", ",")}`}
              </div>
              <span className="text-[11px] text-gray-300 font-medium mt-0.5">
                {activeTournament.entryFee === 0 ? "Sem taxa de inscrição" : "Liberação Automática"}
              </span>
            </div>

            {/* Tempo Restante */}
            <div className="glass-card rounded-3xl p-5 relative overflow-hidden flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-black uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4 text-gray-300" />
                <span>Encerramento</span>
              </div>
              <CountdownTimer targetDate={activeTournament.deadlinePredictions} />
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Até antes da 1ª partida</span>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO MOBILE-FIRST */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              href={`/bolao/${activeTournament.id}/palpites`}
              className="w-full sm:w-auto flex-1 py-4 px-8 bg-pitch-green hover:bg-pitch-light text-arena-950 font-black text-base rounded-2xl transition shadow-glow flex items-center justify-center gap-2 group active:scale-95 animate-neon-pulse"
            >
              <span>{activeTournament.entryFee === 0 ? "Participar Grátis Agora" : "Enviar Meus Palpites"}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href={`/bolao/${activeTournament.id}/ranking`}
              className="w-full sm:w-auto py-4 px-6 bg-arena-850 hover:bg-arena-800 text-white font-bold text-sm rounded-2xl border border-arena-700 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Trophy className="w-4 h-4 text-gold-500" />
              <span>Ver Classificação</span>
            </Link>
          </div>
        </div>
      </section>

      {/* VITRINE DOS JOGOS OFICIAIS */}
      <section className="py-10 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-pitch-green uppercase tracking-wider mb-0.5">
              <Flame className="w-4 h-4" />
              <span>Rodada Oficial</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Jogos Válidos para Pontuação
            </h2>
          </div>
          <Link
            href={`/bolao/${activeTournament.id}/palpites`}
            className="text-xs font-bold text-pitch-green hover:underline flex items-center gap-1"
          >
            <span>Ver Todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayMatches.map((match: any) => {
            const isChampions = (match.stadium || "").includes("Champions");

            return (
              <div
                key={match.id}
                className="glass-card rounded-2xl p-4 transition-all hover:scale-[1.01]"
              >
                {/* Tag de Competição e Horário */}
                <div className="flex items-center justify-between text-[11px] mb-2.5 pb-2 border-b border-arena-800">
                  <div className="flex items-center gap-1 font-bold">
                    {isChampions ? (
                      <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                        ⭐️ Champions League
                      </span>
                    ) : (
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        🇧🇷 Brasileirão Série A
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gold-400">
                    {formatMatchDate(match.matchDate)}
                  </span>
                </div>

                {/* Confronto */}
                <div className="grid grid-cols-7 items-center text-center py-1">
                  {/* Mandante */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white text-right truncate">
                      {match.homeTeam}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-arena-800 border border-arena-700 flex items-center justify-center font-black text-xs text-white shrink-0">
                      {match.homeTeam.charAt(0)}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="col-span-1 flex justify-center">
                    <span className="text-xs font-black text-gray-500">VS</span>
                  </div>

                  {/* Visitante */}
                  <div className="col-span-3 flex items-center justify-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-arena-800 border border-arena-700 flex items-center justify-center font-black text-xs text-white shrink-0">
                      {match.awayTeam.charAt(0)}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white text-left truncate">
                      {match.awayTeam}
                    </span>
                  </div>
                </div>

                {/* Local */}
                <div className="text-[10px] text-gray-400 text-center mt-2 truncate">
                  {match.stadium || "Estádio Oficial"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* COMO PARTICIPAR EM 3 PASSOS */}
      <section className="py-10 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Como Funciona o Bolão
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Simples, rápido e 100% automatizado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-pitch-green/10 text-pitch-green font-black text-base flex items-center justify-center mb-3 border border-pitch-green/30">
              1
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Garanta sua Vaga</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {activeTournament.entryFee === 0
                ? "Faça seu cadastro rápido com Nome, WhatsApp e E-mail. Sua vaga é liberada na hora sem nenhum custo!"
                : `Pague R$ ${activeTournament.entryFee.toFixed(2).replace(".", ",")} via Pix QR Code ou Copia e Cola. O webhook aprova na hora.`}
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-pitch-green/10 text-pitch-green font-black text-base flex items-center justify-center mb-3 border border-pitch-green/30">
              2
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Crave seus Palpites</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Preencha os placares das partidas de amanhã antes das 16:59. Ao clicar em confirmar, seus palpites ficam travados e registrados com segurança.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-pitch-green/10 text-pitch-green font-black text-base flex items-center justify-center mb-3 border border-pitch-green/30">
              3
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Fature no Pix</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Acompanhe sua pontuação ao vivo no Ranking. Quem terminar na liderança recebe a premiação transferida direto na chave Pix!
            </p>
          </div>
        </div>
      </section>

      {/* CLASSIFICAÇÃO / RANKING PRÉVIA */}
      {topParticipants.length > 0 && (
        <section className="py-8 px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Líderes do Bolão
              </h2>
              <p className="text-xs text-gray-400">Classificação atualizada em tempo real</p>
            </div>
            <Link
              href={`/bolao/${activeTournament.id}/ranking`}
              className="text-xs font-bold text-pitch-green hover:underline flex items-center gap-1"
            >
              <span>Ver Ranking Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-3xl divide-y divide-arena-800 overflow-hidden">
            {topParticipants.map((part: any, idx: number) => (
              <div
                key={part.id}
                className="flex items-center justify-between p-4 hover:bg-arena-850/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? "bg-gold-500 text-arena-950 shadow-goldglow"
                        : idx === 1
                        ? "bg-gray-300 text-arena-950"
                        : idx === 2
                        ? "bg-amber-700 text-white"
                        : "bg-arena-800 text-gray-400"
                    }`}
                  >
                    {idx + 1}º
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{part.user.name}</div>
                    <div className="text-[11px] text-gray-400">
                      {part.exactScoresCount} placares cravados
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-pitch-green font-mono">
                    {part.totalPoints} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="mt-14 py-8 border-t border-arena-800/80 text-center text-xs text-gray-500">
        <p className="max-w-md mx-auto px-4">
          Bolão dos Cria © 2026. Plataforma de palpites esportivos.
        </p>
      </footer>
    </div>
  );
}
