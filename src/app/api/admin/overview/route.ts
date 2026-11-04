import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdmin();

    const activeTournament = await prisma.tournament.findFirst({
      where: { isActive: true },
      include: {
        matches: { orderBy: { matchDate: "asc" } },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true, favoriteTeam: true } },
            payments: { take: 1, orderBy: { createdAt: "desc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

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
      tournament: activeTournament,
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
