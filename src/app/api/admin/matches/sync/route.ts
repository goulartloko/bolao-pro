import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MATCH_FEEDS = {
  "QUARTA_BRASILEIRAO_CHAMPIONS": {
    name: "Super Rodada 10 Jogos (Brasileirão Série A + Champions League)",
    title: "Super Rodada dos Campeões - Brasileirão & Champions League (10 Jogos)",
    deadline: "2026-11-04T16:59:00-03:00",
    matches: [
      {
        homeTeam: "Slavia Praga",
        awayTeam: "Arsenal",
        stadium: "Eden Arena, Praga (Champions League)",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Borussia Dortmund",
        awayTeam: "Real Betis",
        stadium: "Signal Iduna Park, Dortmund (Champions League)",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Inter de Milão",
        awayTeam: "Bayern de Munique",
        stadium: "San Siro, Milão (Champions League)",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Paris Saint-Germain",
        awayTeam: "Atlético de Madrid",
        stadium: "Parc des Princes, Paris (Champions League)",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Flamengo",
        awayTeam: "Grêmio",
        stadium: "Estádio do Maracanã, Rio de Janeiro (Brasileirão Série A)",
        matchDate: "2026-11-04T19:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Athletico-PR",
        awayTeam: "Vasco",
        stadium: "Ligga Arena, Curitiba (Brasileirão Série A)",
        matchDate: "2026-11-04T19:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Cruzeiro",
        awayTeam: "Fluminense",
        stadium: "Estádio Mineirão, Belo Horizonte (Brasileirão Série A)",
        matchDate: "2026-11-04T20:00:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Palmeiras",
        awayTeam: "Internacional",
        stadium: "Allianz Parque, São Paulo (Brasileirão Série A)",
        matchDate: "2026-11-04T21:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Botafogo",
        awayTeam: "Atlético-MG",
        stadium: "Estádio Nilton Santos, Rio de Janeiro (Brasileirão Série A)",
        matchDate: "2026-11-04T21:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "São Paulo",
        awayTeam: "Corinthians",
        stadium: "MorumBIS, São Paulo (Clássico Majestoso - Brasileirão)",
        matchDate: "2026-11-04T21:30:00-03:00",
        roundNumber: 34,
      },
    ],
  },
  "LA_LIGA_R12": {
    name: "La Liga Espanhola - Rodada 12 (Fim de Semana)",
    title: "La Liga 2026/27 - Rodada 12 Oficial",
    deadline: "2026-11-06T16:59:00-03:00",
    matches: [
      {
        homeTeam: "Sevilla",
        awayTeam: "Deportivo Alavés",
        stadium: "Ramón Sánchez-Pizjuán, Sevilha",
        matchDate: "2026-11-06T17:00:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Osasuna",
        awayTeam: "Athletic Club",
        stadium: "Estádio El Sadar, Pamplona",
        matchDate: "2026-11-07T14:30:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Valencia",
        awayTeam: "Real Madrid",
        stadium: "Estádio de Mestalla, Valência",
        matchDate: "2026-11-07T17:00:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Elche",
        awayTeam: "Real Betis",
        stadium: "Estádio Manuel Martínez Valero, Elche",
        matchDate: "2026-11-08T10:00:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Real Sociedad",
        awayTeam: "Rayo Vallecano",
        stadium: "Reale Arena, San Sebastián",
        matchDate: "2026-11-08T12:15:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Villarreal",
        awayTeam: "Getafe",
        stadium: "Estadio de la Cerámica, Villarreal",
        matchDate: "2026-11-08T14:30:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Atlético de Madrid",
        awayTeam: "Barcelona",
        stadium: "Estádio Cívitas Metropolitano, Madri",
        matchDate: "2026-11-08T17:00:00-03:00",
        roundNumber: 12,
      },
    ],
  },
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    await requireAdmin(bearerToken);

    const { feedKey, replaceExisting } = await req.json();

    const feed = MATCH_FEEDS[feedKey as keyof typeof MATCH_FEEDS] || MATCH_FEEDS["QUARTA_BRASILEIRAO_CHAMPIONS"];

    // Busca o bolão ativo
    const tournament = await prisma.tournament.findFirst({
      where: { isActive: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Nenhum bolão ativo encontrado." }, { status: 404 });
    }

    // Se solicitado para substituir jogos antigos
    if (replaceExisting) {
      // Deleta primeiro os palpites associados a partidas deste torneio
      await prisma.prediction.deleteMany({
        where: { match: { tournamentId: tournament.id } },
      });
      await prisma.match.deleteMany({
        where: { tournamentId: tournament.id },
      });
    }

    // Atualiza título e prazo do bolão conforme a rodada sincronizada
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        title: feed.title,
        deadlinePredictions: new Date(feed.deadline),
      },
    });

    const created = [];
    for (const m of feed.matches) {
      const match = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          stadium: m.stadium,
          matchDate: new Date(m.matchDate),
          roundNumber: m.roundNumber,
          status: "SCHEDULED",
        },
      });
      created.push(match);
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/bolao/[id]/palpites", "page");
      revalidatePath("/bolao/[id]/ranking", "page");
    } catch {
      // Ignora erro fora de contexto de rota
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} partidas sincronizadas com sucesso! A rodada agora possui ${created.length} jogos para evitar empates.`,
      feedName: feed.name,
      count: created.length,
    });
  } catch (error: any) {
    console.error("Erro na sincronização de partidas:", error);
    return NextResponse.json({ error: error.message || "Erro ao sincronizar partidas." }, { status: 500 });
  }
}
