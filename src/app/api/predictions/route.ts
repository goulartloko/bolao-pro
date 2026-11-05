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

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { matches: true },
    });

    const now = new Date();
    // Verifica se ainda existem partidas que NÃO começaram (mais de 5 min antes)
    const hasOpenMatches = (tournament?.matches || []).some((m) => {
      const matchDeadline = new Date(m.matchDate).getTime() - 5 * 60 * 1000;
      return m.status === "SCHEDULED" && now.getTime() < matchDeadline;
    });

    const hasSubmitted = (participant?.predictions || []).length > 0;
    // Só trava tudo se não houver mais nenhum jogo aberto na rodada
    const isLocked = !hasOpenMatches && hasSubmitted;

    return NextResponse.json({
      participant,
      predictions: participant?.predictions || [],
      isPaid: participant?.paymentStatus === "PAID",
      hasSubmitted,
      isLocked,
      hasOpenMatches,
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

    // 1. Busca o torneio e as partidas
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { matches: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 });
    }

    const now = new Date();

    // 2. Valida ou inscreve o participante (se gratuito, aprova automaticamente)
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

    // 3. Salva / Atualiza partida a partida com bloqueio individual de horário
    // Jogos iniciados (ou a 5 min de começar) ou finalizados NUNCA são alterados!
    // Jogos futuros continuam abertos para edição!
    const matchMap = new Map(tournament.matches.map((m) => [m.id, m]));
    const results = [];
    let lockedCount = 0;

    for (const item of predictions) {
      const match = matchMap.get(item.matchId);
      if (!match) continue;

      // Bloqueio rigoroso por partida: 5 minutos antes do início do jogo
      const matchDeadlineMs = new Date(match.matchDate).getTime() - 5 * 60 * 1000;
      const isMatchBlocked = now.getTime() >= matchDeadlineMs || match.status !== "SCHEDULED";

      if (isMatchBlocked) {
        lockedCount += 1;
        continue; // Não altera partidas já travadas ou em andamento
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
      message: results.length > 0
        ? "Palpites salvos com sucesso! Os jogos futuros foram atualizados."
        : "Nenhum jogo aberto para edição no momento.",
      updatedCount: results.length,
      lockedSkipped: lockedCount,
    });
  } catch (error: any) {
    console.error("Erro ao salvar palpites:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar palpites." },
      { status: 500 }
    );
  }
}
