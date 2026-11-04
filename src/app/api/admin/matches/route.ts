import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    await requireAdmin(bearerToken);

    const {
      tournamentId,
      homeTeam,
      awayTeam,
      homeTeamLogo,
      awayTeamLogo,
      stadium,
      matchDate,
      roundNumber,
    } = await req.json();

    if (!tournamentId || !homeTeam || !awayTeam || !matchDate) {
      return NextResponse.json(
        { error: "Torneio, Time Casa, Time Fora e Data/Horário são obrigatórios." },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        homeTeamLogo: homeTeamLogo?.trim() || null,
        awayTeamLogo: awayTeamLogo?.trim() || null,
        stadium: stadium?.trim() || null,
        matchDate: new Date(matchDate),
        roundNumber: roundNumber ? parseInt(roundNumber, 10) : 1,
        status: "SCHEDULED",
      },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/bolao/[id]/palpites", "page");
    } catch {
      // Ignora erro de revalidate se fora de contexto
    }

    return NextResponse.json({ success: true, match });
  } catch (error: any) {
    console.error("Erro ao cadastrar partida:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao cadastrar partida." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    await requireAdmin(bearerToken);

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("id");

    if (!matchId) {
      return NextResponse.json({ error: "ID da partida é obrigatório." }, { status: 400 });
    }

    await prisma.match.delete({
      where: { id: matchId },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/bolao/[id]/palpites", "page");
    } catch {
      // Ignora erro de revalidate se fora de contexto
    }

    return NextResponse.json({ success: true, message: "Partida excluída com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir partida:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir partida." }, { status: 500 });
  }
}
