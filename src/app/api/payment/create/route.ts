import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPixPayment } from "@/lib/pixService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Você precisa estar conectado para realizar o pagamento." },
        { status: 401 }
      );
    }

    const { tournamentId } = await req.json();

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Bolão não encontrado." },
        { status: 404 }
      );
    }

    // Cria a cobrança Pix
    const pixData = await createPixPayment({
      userId: user.id,
      tournamentId: tournament.id,
      amount: tournament.entryFee,
      description: `Inscrição - ${tournament.title}`,
      userEmail: user.email,
      userName: user.name,
      userPhone: user.phone,
    });

    return NextResponse.json({
      success: true,
      pix: pixData,
      tournament: {
        id: tournament.id,
        title: tournament.title,
        entryFee: tournament.entryFee,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar Pix:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar código Pix." },
      { status: 500 }
    );
  }
}
