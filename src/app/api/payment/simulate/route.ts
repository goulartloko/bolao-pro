import { NextRequest, NextResponse } from "next/server";
import { approvePayment } from "@/lib/pixService";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId é obrigatório." }, { status: 400 });
    }

    const result = await approvePayment(paymentId, JSON.stringify({ simulatedBy: user.email, timestamp: new Date() }));

    return NextResponse.json({
      success: true,
      message: "Pagamento Pix aprovado com sucesso via simulador de teste!",
      result,
    });
  } catch (error: any) {
    console.error("Erro na simulação do Pix:", error);
    return NextResponse.json({ error: error.message || "Erro ao aprovar Pix." }, { status: 500 });
  }
}
