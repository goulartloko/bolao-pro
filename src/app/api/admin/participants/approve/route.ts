import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    const admin = await requireAdmin(bearerToken);
    const { participantId, userId, tournamentId } = await req.json();

    let targetParticipant = null;

    if (participantId) {
      targetParticipant = await prisma.participant.findUnique({
        where: { id: participantId },
      });
    } else if (userId && tournamentId) {
      targetParticipant = await prisma.participant.findUnique({
        where: {
          userId_tournamentId: {
            userId,
            tournamentId,
          },
        },
      });
    }

    if (!targetParticipant) {
      return NextResponse.json({ error: "Participante não encontrado." }, { status: 404 });
    }

    const now = new Date();

    // 1. Atualiza o participante para PAID
    const updated = await prisma.participant.update({
      where: { id: targetParticipant.id },
      data: {
        paymentStatus: "PAID",
        paidAt: now,
      },
      include: {
        user: true,
      },
    });

    // 2. Se houver pagamento pendente, marca como pago
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        userId: targetParticipant.userId,
        tournamentId: targetParticipant.tournamentId,
        status: "PENDING",
      },
    });

    if (pendingPayment) {
      await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          status: "PAID",
          paidAt: now,
          rawWebhookData: JSON.stringify({ manualApprovalBy: admin.email, date: now }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Usuário ${updated.user.name} aprovado manualmente com sucesso!`,
      participant: updated,
    });
  } catch (error: any) {
    console.error("Erro na aprovação manual:", error);
    return NextResponse.json({ error: error.message || "Erro ao aprovar participante." }, { status: 500 });
  }
}
