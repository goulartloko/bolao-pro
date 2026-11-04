import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

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
    const user = await getCurrentUser();

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

    // 1. Valida se o usuário pagou o Pix
    const participant = await prisma.participant.findUnique({
      where: {
        userId_tournamentId: {
          userId: user.id,
          tournamentId,
        },
      },
    });

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

    // 2. Busca o torneio e as partidas para verificar os horários de bloqueio
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { matches: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 });
    }

    const now = new Date();

    // Se o prazo geral já expirou
    if (now > new Date(tournament.deadlinePredictions)) {
      return NextResponse.json(
        { error: "O prazo limite para envio de palpites deste bolão já expirou." },
        { status: 400 }
      );
    }

    const matchMap = new Map(tournament.matches.map((m) => [m.id, m]));
    const results = [];

    for (const item of predictions) {
      const match = matchMap.get(item.matchId);
      if (!match) continue;

      // Bloqueio automático: se o jogo já começou ou está finalizado, não aceita palpite
      if (now >= new Date(match.matchDate) || match.status !== "SCHEDULED") {
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
