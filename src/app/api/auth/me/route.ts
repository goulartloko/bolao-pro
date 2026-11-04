import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    const user = await getCurrentUser(bearerToken);

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Busca o bolão ativo
    const activeTournament = await prisma.tournament.findFirst({
      where: { isActive: true },
      include: {
        matches: {
          orderBy: { matchDate: "asc" },
        },
      },
    });

    let participantStatus = null;
    let participantId = null;

    if (activeTournament) {
      const participant = await prisma.participant.findUnique({
        where: {
          userId_tournamentId: {
            userId: user.id,
            tournamentId: activeTournament.id,
          },
        },
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (participant) {
        participantStatus = participant.paymentStatus;
        participantId = participant.id;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user,
      activeTournamentId: activeTournament?.id || null,
      participantId,
      participantStatus,
    });
  } catch (error: any) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
