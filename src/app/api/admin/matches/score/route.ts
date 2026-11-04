import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processMatchScores } from "@/lib/scoreEngine";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { matchId, homeScore, awayScore } = await req.json();

    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: "matchId, homeScore e awayScore são obrigatórios." },
        { status: 400 }
      );
    }

    const parsedHome = parseInt(homeScore, 10);
    const parsedAway = parseInt(awayScore, 10);

    if (isNaN(parsedHome) || isNaN(parsedAway)) {
      return NextResponse.json({ error: "Placares devem ser números inteiros." }, { status: 400 });
    }

    // Atualiza o placar oficial do jogo
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: parsedHome,
        awayScore: parsedAway,
        status: "FINISHED",
      },
    });

    // Dispara o cálculo e atualização do ranking automático em lote!
    const scoreResult = await processMatchScores(matchId);

    return NextResponse.json({
      success: true,
      message: "Placar salvo e pontuação de todos os participantes recalculada com sucesso!",
      result: scoreResult,
    });
  } catch (error: any) {
    console.error("Erro ao salvar placar e processar pontuação:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar pontuação." },
      { status: 500 }
    );
  }
}
