import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");

    if (!tournamentId) {
      return NextResponse.json({ error: "tournamentId é obrigatório." }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: {
        userId_tournamentId: {
          userId: user.id,
          tournamentId,
        },
      },
      include: {
        predictions: true,
      },
    });

    const hasSubmitted = (participant?.predictions || []).length > 0;
    const isLocked = hasSubmitted && (participant?.predictions || []).some((p) => p.isLocked);

    return NextResponse.json({
      participant,
      predictions: participant?.predictions || [],
      isPaid: participant?.paymentStatus === "PAID",
      hasSubmitted,
      isLocked,
    });
  } catch (error: any) {
    console.error("Erro ao buscar palpites:", error);
    return NextResponse.json({ error: "Erro interno ao carregar palpites." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Você precisa estar conectado." }, { status: 401 });
    }

    const { tournamentId, predictions } = await req.json();

    if (!tournamentId || !Array.isArray(predictions)) {
      return NextResponse.json(
        { error: "Dados inválidos para envio de palpites." },
        { status: 400 }
      );
    }

    // 1. Busca o torneio e as partidas para verificar os horários de bloqueio
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { matches: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 });
    }

    const now = new Date();

    // 2. Cálculo do prazo rigoroso: 5 minutos antes do primeiro jogo
    const matchTimes = tournament.matches.map((m) => new Date(m.matchDate).getTime());
    const earliestMatchTime = matchTimes.length > 0 ? Math.min(...matchTimes) : null;
    const fiveMinBeforeFirst = earliestMatchTime ? earliestMatchTime - 5 * 60 * 1000 : null;

    let effectiveDeadlineMs = new Date(tournament.deadlinePredictions).getTime();
    if (fiveMinBeforeFirst && fiveMinBeforeFirst < effectiveDeadlineMs) {
      effectiveDeadlineMs = fiveMinBeforeFirst;
    }

    if (now.getTime() >= effectiveDeadlineMs) {
      return NextResponse.json(
        {
          error:
            "Prazo encerrado: os palpites são bloqueados exatamente 5 minutos antes do início do primeiro jogo da rodada para garantir a apuração oficial.",
        },
        { status: 403 }
      );
    }

    // 3. Valida ou inscreve o participante (se gratuito, aprova automaticamente)
    let participant = await prisma.participant.findUnique({
      where: {
        userId_tournamentId: {
          userId: user.id,
          tournamentId,
        },
      },
    });

    if (!participant && tournament.entryFee === 0) {
      const totalExistingParts = await prisma.participant.count({
        where: { tournamentId },
      });

      participant = await prisma.participant.create({
        data: {
          userId: user.id,
          tournamentId,
          paymentStatus: "PAID",
          paidAt: new Date(),
          totalPoints: 0,
          exactScoresCount: 0,
          winnerPicksCount: 0,
          rankPosition: totalExistingParts + 1,
        },
      });
    }

    if (!participant || participant.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Acesso bloqueado. É necessário confirmar a inscrição para registrar palpites." },
        { status: 403 }
      );
    }

    // Verifica se os palpites já foram travados anteriormente
    const alreadyLocked = await prisma.prediction.findFirst({
      where: {
        participantId: participant.id,
        isLocked: true,
      },
    });

    if (alreadyLocked) {
      return NextResponse.json(
        { error: "Seus palpites para esta rodada já foram enviados e estão travados para apuração oficial." },
        { status: 403 }
      );
    }

    const matchMap = new Map(tournament.matches.map((m) => [m.id, m]));
    const results = [];

    for (const item of predictions) {
      const match = matchMap.get(item.matchId);
      if (!match) continue;

      // Bloqueio rigoroso por partida: 5 minutos antes do início do jogo
      const matchDeadlineMs = new Date(match.matchDate).getTime() - 5 * 60 * 1000;
      if (now.getTime() >= matchDeadlineMs || match.status !== "SCHEDULED") {
        continue;
      }

      const homeScore = Math.max(0, parseInt(item.homeScore ?? 0, 10));
      const awayScore = Math.max(0, parseInt(item.awayScore ?? 0, 10));

      const saved = await prisma.prediction.upsert({
        where: {
          participantId_matchId: {
            participantId: participant.id,
            matchId: match.id,
          },
        },
        update: {
          homeScore,
          awayScore,
          isLocked: true,
        },
        create: {
          participantId: participant.id,
          userId: user.id,
          matchId: match.id,
          homeScore,
          awayScore,
          isLocked: true,
        },
      });

      results.push(saved);
    }

    return NextResponse.json({
      success: true,
      message: "Palpites salvos e confirmados com sucesso! Seus palpites estão travados para apuração.",
      count: results.length,
      isLocked: true,
    });
  } catch (error: any) {
    console.error("Erro ao salvar palpites:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar palpites." },
      { status: 500 }
    );
  }
}
