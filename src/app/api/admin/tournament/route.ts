import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const data = await req.json();
    const {
      id,
      title,
      type, // ROUND_WEEKLY ou MONTHLY_LEAGUE
      entryFee,
      prizePool,
      prizeDescription,
      exactScorePoints,
      winnerPoints,
      goalDiffPoints,
      startDate,
      endDate,
      deadlinePredictions,
      isActive,
    } = data;

    if (!title || !startDate || !endDate || !deadlinePredictions) {
      return NextResponse.json(
        { error: "Título, Data de Início, Data de Fim e Prazo Limite de Palpites são obrigatórios." },
        { status: 400 }
      );
    }

    // Se estiver marcando como ativo, desativa os outros
    if (isActive) {
      await prisma.tournament.updateMany({
        where: { id: { not: id || "none" } },
        data: { isActive: false },
      });
    }

    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const tournament = id
      ? await prisma.tournament.update({
          where: { id },
          data: {
            title,
            slug: `${slug}-${Date.now().toString().slice(-4)}`,
            type: type || "ROUND_WEEKLY",
            entryFee: parseFloat(entryFee ?? 10),
            prizePool: parseFloat(prizePool ?? 200),
            prizeDescription,
            exactScorePoints: parseInt(exactScorePoints ?? 10, 10),
            winnerPoints: parseInt(winnerPoints ?? 5, 10),
            goalDiffPoints: parseInt(goalDiffPoints ?? 2, 10),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            deadlinePredictions: new Date(deadlinePredictions),
            isActive: Boolean(isActive),
          },
        })
      : await prisma.tournament.create({
          data: {
            title,
            slug: `${slug}-${Date.now().toString().slice(-4)}`,
            type: type || "ROUND_WEEKLY",
            entryFee: parseFloat(entryFee ?? 10),
            prizePool: parseFloat(prizePool ?? 200),
            prizeDescription,
            exactScorePoints: parseInt(exactScorePoints ?? 10, 10),
            winnerPoints: parseInt(winnerPoints ?? 5, 10),
            goalDiffPoints: parseInt(goalDiffPoints ?? 2, 10),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            deadlinePredictions: new Date(deadlinePredictions),
            isActive: isActive !== undefined ? Boolean(isActive) : true,
          },
        });

    return NextResponse.json({ success: true, tournament });
  } catch (error: any) {
    console.error("Erro ao salvar bolão:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao configurar bolão." },
      { status: 500 }
    );
  }
}
