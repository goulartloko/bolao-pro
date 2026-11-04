import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    await requireAdmin(bearerToken);

    const activeTournament = await prisma.tournament.findFirst({
      where: { isActive: true },
      include: {
        matches: { orderBy: { matchDate: "asc" } },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true, favoriteTeam: true } },
            payments: { take: 1, orderBy: { createdAt: "desc" } },
            predictions: {
              include: {
                match: {
                  select: {
                    id: true,
                    homeTeam: true,
                    awayTeam: true,
                    homeScore: true,
                    awayScore: true,
                    matchDate: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    let tournamentWithRank = activeTournament;
    if (activeTournament) {
      // Ordena por pontuação oficial para determinar a colocação real de cada participante
      const sortedByRank = [...activeTournament.participants].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.exactScoresCount !== a.exactScoresCount) return b.exactScoresCount - a.exactScoresCount;
        if (b.winnerPicksCount !== a.winnerPicksCount) return b.winnerPicksCount - a.winnerPicksCount;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const rankMap = new Map<string, number>();
      sortedByRank.forEach((p, idx) => rankMap.set(p.id, idx + 1));

      const participantsWithRank = activeTournament.participants.map((p) => ({
        ...p,
        rankPosition: rankMap.get(p.id) || p.rankPosition || 1,
      }));

      tournamentWithRank = {
        ...activeTournament,
        participants: participantsWithRank,
      };
    }

    const totalUsers = await prisma.user.count();
    const paidParticipantsCount = activeTournament
      ? activeTournament.participants.filter((p) => p.paymentStatus === "PAID").length
      : 0;

    const totalCollected = activeTournament
      ? paidParticipantsCount * activeTournament.entryFee
      : 0;

    const totalPredictions = activeTournament
      ? await prisma.prediction.count({
          where: { participant: { tournamentId: activeTournament.id } },
        })
      : 0;

    return NextResponse.json({
      tournament: tournamentWithRank,
      metrics: {
        totalUsers,
        paidParticipantsCount,
        totalParticipants: activeTournament?.participants.length || 0,
        totalCollected,
        totalPredictions,
        totalMatches: activeTournament?.matches.length || 0,
        finishedMatches: activeTournament?.matches.filter((m) => m.status === "FINISHED").length || 0,
      },
    });
  } catch (error: any) {
    console.error("Erro na visão geral do admin:", error);
    return NextResponse.json({ error: error.message || "Não autorizado." }, { status: 403 });
  }
}
