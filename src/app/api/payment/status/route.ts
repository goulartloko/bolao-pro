import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const tournamentId = searchParams.get("tournamentId");

    let payment = null;

    if (paymentId) {
      payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { participant: true },
      });
    } else if (tournamentId) {
      payment = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          tournamentId,
        },
        orderBy: { createdAt: "desc" },
        include: { participant: true },
      });
    }

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      status: payment.status,
      isPaid: payment.status === "PAID",
      amount: payment.amount,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
    });
  } catch (error: any) {
    console.error("Erro ao verificar status do pagamento:", error);
    return NextResponse.json({ error: "Erro interno ao verificar pagamento." }, { status: 500 });
  }
}
