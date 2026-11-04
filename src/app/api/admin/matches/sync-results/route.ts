import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processMatchScores } from "@/lib/scoreEngine";
import { fetchRodadaApiFutebol } from "@/lib/apiFutebol";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    await requireAdmin(bearerToken);

    const tournament = await prisma.tournament.findFirst({
      where: { isActive: true },
      include: {
        matches: true,
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Nenhum bolão ativo encontrado." }, { status: 404 });
    }

    // Busca dados da rodada na API Futebol Oficial
    let rodadaData;
    try {
      rodadaData = await fetchRodadaApiFutebol(10, 34);
    } catch (e: any) {
      return NextResponse.json(
        { error: `Não foi possível consultar a API Futebol no momento: ${e.message}` },
        { status: 500 }
      );
    }

    const partidasApi = rodadaData.partidas || [];
    let updatedCount = 0;
    const updatedMatches: string[] = [];

    for (const match of tournament.matches) {
      // Procura confronto correspondente na API Futebol
      const found = partidasApi.find((p) => {
        const mandanteApi = p.time_mandante.nome_popular.toLowerCase().trim();
        const visitanteApi = p.time_visitante.nome_popular.toLowerCase().trim();
        const mandanteMatch = match.homeTeam.toLowerCase().trim();
        const visitanteMatch = match.awayTeam.toLowerCase().trim();

        return (
          (mandanteApi.includes(mandanteMatch) || mandanteMatch.includes(mandanteApi)) &&
          (visitanteApi.includes(visitanteMatch) || visitanteMatch.includes(visitanteApi))
        );
      });

      if (
        found &&
        (found.status === "finalizado" ||
          (found.placar_mandante !== null && found.placar_visitante !== null))
      ) {
        const homeScore = found.placar_mandante ?? 0;
        const awayScore = found.placar_visitante ?? 0;

        await prisma.match.update({
          where: { id: match.id },
          data: {
            homeScore,
            awayScore,
            status: "FINISHED",
          },
        });

        // Dispara cálculo de pontuações de todos os palpites e reorganiza o ranking
        await processMatchScores(match.id);
        updatedCount++;
        updatedMatches.push(`${match.homeTeam} ${homeScore} x ${awayScore} ${match.awayTeam}`);
      }
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath(`/bolao/${tournament.id}/ranking`, "page");
    } catch {}

    if (updatedCount === 0) {
      return NextResponse.json({
        success: true,
        message:
          "Nenhuma partida finalizada encontrada na API Futebol ainda. Conforme os jogos terminarem, clique novamente para atualizar ou insira manualmente no placar.",
        updatedCount: 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} partida(s) finalizada(s) sincronizada(s) via API Futebol! Pontuações e ranking de todos os participantes recalculados automaticamente.`,
      updatedCount,
      updatedMatches,
    });
  } catch (error: any) {
    console.error("Erro ao sincronizar resultados:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao sincronizar resultados." },
      { status: 500 }
    );
  }
}
