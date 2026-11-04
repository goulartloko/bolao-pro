import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MATCH_FEEDS = {
  "BRASILEIRAO_R34": {
    name: "Brasileirão Série A - 34ª Rodada Oficial",
    title: "Brasileirão Série A - 34ª Rodada Oficial (10 Jogos)",
    deadline: "2026-11-04T18:59:00-03:00",
    matches: [
      {
        homeTeam: "Flamengo",
        awayTeam: "Grêmio",
        stadium: "Estádio do Maracanã, Rio de Janeiro (RJ)",
        matchDate: "2026-11-04T19:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Athletico-PR",
        awayTeam: "Vasco",
        stadium: "Ligga Arena, Curitiba (PR)",
        matchDate: "2026-11-04T19:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Botafogo",
        awayTeam: "Atlético-MG",
        stadium: "Estádio Nilton Santos, Rio de Janeiro (RJ)",
        matchDate: "2026-11-04T21:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "São Paulo",
        awayTeam: "Corinthians",
        stadium: "MorumBIS, São Paulo (SP)",
        matchDate: "2026-11-04T21:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Cruzeiro",
        awayTeam: "Bahia",
        stadium: "Estádio Mineirão, Belo Horizonte (MG)",
        matchDate: "2026-11-04T21:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Palmeiras",
        awayTeam: "Internacional",
        stadium: "Allianz Parque, São Paulo (SP)",
        matchDate: "2026-11-04T19:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Vitória",
        awayTeam: "Fluminense",
        stadium: "Estádio Barradão, Salvador (BA)",
        matchDate: "2026-11-04T20:00:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Red Bull Bragantino",
        awayTeam: "Santos",
        stadium: "Estádio Nabi Abi Chedid, Bragança Paulista (SP)",
        matchDate: "2026-11-04T19:00:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Fortaleza",
        awayTeam: "Juventude",
        stadium: "Arena Castelão, Fortaleza (CE)",
        matchDate: "2026-11-04T19:00:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Criciúma",
        awayTeam: "Cuiabá",
        stadium: "Estádio Heriberto Hülse, Criciúma (SC)",
        matchDate: "2026-11-04T20:00:00-03:00",
        roundNumber: 34,
      },
    ],
  },
  "BRASILEIRAO_R35": {
    name: "Brasileirão Série A - 35ª Rodada Oficial",
    title: "Brasileirão Série A - 35ª Rodada Oficial (10 Jogos)",
    deadline: "2026-11-07T15:59:00-03:00",
    matches: [
      {
        homeTeam: "Corinthians",
        awayTeam: "Vasco",
        stadium: "Neo Química Arena, São Paulo (SP)",
        matchDate: "2026-11-07T16:00:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Grêmio",
        awayTeam: "Palmeiras",
        stadium: "Arena do Grêmio, Porto Alegre (RS)",
        matchDate: "2026-11-07T16:00:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Fluminense",
        awayTeam: "Flamengo",
        stadium: "Estádio do Maracanã, Rio de Janeiro (RJ)",
        matchDate: "2026-11-07T18:30:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Atlético-MG",
        awayTeam: "São Paulo",
        stadium: "Arena MRV, Belo Horizonte (MG)",
        matchDate: "2026-11-07T18:30:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Internacional",
        awayTeam: "Botafogo",
        stadium: "Estádio Beira-Rio, Porto Alegre (RS)",
        matchDate: "2026-11-07T21:00:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Bahia",
        awayTeam: "Athletico-PR",
        stadium: "Arena Fonte Nova, Salvador (BA)",
        matchDate: "2026-11-08T16:00:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Cruzeiro",
        awayTeam: "Fortaleza",
        stadium: "Estádio Mineirão, Belo Horizonte (MG)",
        matchDate: "2026-11-08T16:00:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Santos",
        awayTeam: "Cuiabá",
        stadium: "Vila Belmiro, Santos (SP)",
        matchDate: "2026-11-08T18:30:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Juventude",
        awayTeam: "Criciúma",
        stadium: "Estádio Alfredo Jaconi, Caxias do Sul (RS)",
        matchDate: "2026-11-08T18:30:00-03:00",
        roundNumber: 35,
      },
      {
        homeTeam: "Vitória",
        awayTeam: "Red Bull Bragantino",
        stadium: "Estádio Barradão, Salvador (BA)",
        matchDate: "2026-11-08T18:30:00-03:00",
        roundNumber: 35,
      },
    ],
  },
  "CHAMPIONS_LEAGUE": {
    name: "UEFA Champions League - Rodada Oficial",
    title: "UEFA Champions League - Rodada Oficial dos Gigantes",
    deadline: "2026-11-04T16:59:00-03:00",
    matches: [
      {
        homeTeam: "Real Madrid",
        awayTeam: "Milan",
        stadium: "Santiago Bernabéu, Madri",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Liverpool",
        awayTeam: "Bayer Leverkusen",
        stadium: "Anfield, Liverpool",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Paris Saint-Germain",
        awayTeam: "Atlético de Madrid",
        stadium: "Parc des Princes, Paris",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Inter de Milão",
        awayTeam: "Arsenal",
        stadium: "San Siro, Milão",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Sporting",
        awayTeam: "Manchester City",
        stadium: "Estádio José Alvalade, Lisboa",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Bayern de Munique",
        awayTeam: "Benfica",
        stadium: "Allianz Arena, Munique",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Estrela Vermelha",
        awayTeam: "Barcelona",
        stadium: "Estádio Rajko Mitić, Belgrado",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
      },
      {
        homeTeam: "Borussia Dortmund",
        awayTeam: "Sturm Graz",
        stadium: "Signal Iduna Park, Dortmund",
        matchDate: "2026-11-04T17:00:00-03:00",
        roundNumber: 4,
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

    const feed = MATCH_FEEDS[feedKey as keyof typeof MATCH_FEEDS] || MATCH_FEEDS["BRASILEIRAO_R34"];

    // Busca o bolão ativo
    const tournament = await prisma.tournament.findFirst({
      where: { isActive: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Nenhum bolão ativo encontrado." }, { status: 404 });
    }

    // Se solicitado para substituir jogos antigos
    if (replaceExisting) {
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
      // Ignora erro fora de contexto
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} partidas da rodada sincronizadas com sucesso!`,
      feedName: feed.name,
      count: created.length,
    });
  } catch (error: any) {
    console.error("Erro na sincronização de partidas:", error);
    return NextResponse.json({ error: error.message || "Erro ao sincronizar partidas." }, { status: 500 });
  }
}
