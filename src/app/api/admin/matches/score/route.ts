import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processMatchScores } from "@/lib/scoreEngine";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    await requireAdmin(bearerToken);

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

    // 1. Atualiza o placar oficial do jogo
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: parsedHome,
        awayScore: parsedAway,
        status: "FINISHED",
      },
    });

    // 2. Dispara o cálculo e reorganização do ranking em tempo real para todos os palpites
    const scoreResult = await processMatchScores(matchId);

    // 3. Invalida cache para que o ranking ao vivo seja imediatamente visível aos usuários
    try {
      revalidatePath("/", "layout");
      revalidatePath("/bolao/[id]/ranking", "page");
      revalidatePath("/bolao/[id]/palpites", "page");
    } catch {
      // Ignora erro de revalidate se fora de contexto de rota
    }

    return NextResponse.json({
      success: true,
      message: `Placar ${parsedHome} x ${parsedAway} salvo! Ranking geral e pontos de todos os participantes recalculados em tempo real.`,
      result: scoreResult,
      match: updatedMatch,
    });
  } catch (error: any) {
    console.error("Erro ao salvar placar e processar pontuação:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar pontuação." },
      { status: 500 }
    );
  }
}
