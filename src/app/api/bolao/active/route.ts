import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: { isActive: true },
      include: {
        matches: {
          orderBy: { matchDate: "asc" },
        },
        participants: {
          where: { paymentStatus: "PAID" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                favoriteTeam: true,
              },
            },
          },
          orderBy: [
            { totalPoints: "desc" },
            { exactScoresCount: "desc" },
            { winnerPicksCount: "desc" },
            { createdAt: "asc" },
          ],
        },
      },
    });

    const participantsWithRank = tournament
      ? tournament.participants.map((p, idx) => ({
          ...p,
          rankPosition: idx + 1,
        }))
      : [];

    const tournamentWithRank = tournament
      ? { ...tournament, participants: participantsWithRank }
      : null;

    return NextResponse.json(
      { tournament: tournamentWithRank },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Erro ao buscar bolão ativo:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar bolão ativo.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
