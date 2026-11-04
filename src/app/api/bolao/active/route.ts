import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({ tournament });
  } catch (error: any) {
    console.error("Erro ao buscar bolão ativo:", error);
    return NextResponse.json({ error: "Erro interno ao buscar bolão ativo." }, { status: 500 });
  }
}
