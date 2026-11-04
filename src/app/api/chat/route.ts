import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");

    if (!tournamentId) {
      return NextResponse.json({ error: "tournamentId é obrigatório." }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            favoriteTeam: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 60,
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Erro ao carregar mensagens do chat:", error);
    return NextResponse.json({ error: "Erro ao buscar mensagens." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Você precisa fazer login para participar da resenha." },
        { status: 401 }
      );
    }

    const { tournamentId, message } = await req.json();

    if (!tournamentId || !message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Mensagem inválida." },
        { status: 400 }
      );
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length > 250) {
      return NextResponse.json(
        { error: "A mensagem pode ter no máximo 250 caracteres." },
        { status: 400 }
      );
    }

    // Verifica se o usuário é participante do bolão
    let participant = await prisma.participant.findUnique({
      where: {
        userId_tournamentId: {
          userId: user.id,
          tournamentId,
        },
      },
    });

    // Se o bolão for grátis e o usuário ainda não tiver participant, registra automaticamente
    if (!participant) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });
      if (tournament && tournament.entryFee === 0) {
        participant = await prisma.participant.create({
          data: {
            userId: user.id,
            tournamentId,
            paymentStatus: "PAID",
            paidAt: new Date(),
          },
        });
      }
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Apenas jogadores inscritos no bolão podem mandar mensagens na resenha." },
        { status: 403 }
      );
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        tournamentId,
        userId: user.id,
        message: cleanMessage,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            favoriteTeam: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error("Erro ao enviar mensagem no chat:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao postar mensagem." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json({ error: "messageId é obrigatório." }, { status: 400 });
    }

    const msg = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!msg) {
      return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
    }

    // Permissão: Próprio autor OU Administrador
    if (msg.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Você só pode apagar suas próprias mensagens." },
        { status: 403 }
      );
    }

    await prisma.chatMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true, message: "Mensagem apagada com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao apagar mensagem do chat:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao apagar mensagem." },
      { status: 500 }
    );
  }
}

