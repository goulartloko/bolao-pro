import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Função auxiliar para reordenar posições no ranking após qualquer alteração
 */
async function reorderTournamentRanking(tournamentId: string) {
  const ranked = await prisma.participant.findMany({
    where: { tournamentId },
    orderBy: [
      { totalPoints: "desc" },
      { exactScoresCount: "desc" },
      { winnerPicksCount: "desc" },
      { createdAt: "asc" },
    ],
  });

  for (let index = 0; index < ranked.length; index++) {
    await prisma.participant.update({
      where: { id: ranked[index].id },
      data: { rankPosition: index + 1 },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { participantId, action, value, delta, userData } = body;

    if (!participantId || !action) {
      return NextResponse.json(
        { error: "participantId e action são obrigatórios." },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { user: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participante não encontrado." }, { status: 404 });
    }

    let message = "";

    switch (action) {
      // 1. Aumentar, Diminuir ou Definir Pontuação
      case "UPDATE_POINTS": {
        let newTotal = participant.totalPoints;
        if (delta !== undefined) {
          newTotal = Math.max(0, participant.totalPoints + Number(delta));
        } else if (value !== undefined) {
          newTotal = Math.max(0, Number(value));
        }

        await prisma.participant.update({
          where: { id: participantId },
          data: { totalPoints: newTotal },
        });

        await reorderTournamentRanking(participant.tournamentId);
        message = `Pontuação de ${participant.user.name} atualizada para ${newTotal} pts! Ranking recalculado.`;
        break;
      }

      // 2. Aumentar, Diminuir ou Definir Placares Exatos (Cravadas)
      case "UPDATE_EXACTS": {
        let newExacts = participant.exactScoresCount;
        if (delta !== undefined) {
          newExacts = Math.max(0, participant.exactScoresCount + Number(delta));
        } else if (value !== undefined) {
          newExacts = Math.max(0, Number(value));
        }

        await prisma.participant.update({
          where: { id: participantId },
          data: { exactScoresCount: newExacts },
        });

        await reorderTournamentRanking(participant.tournamentId);
        message = `Cravadas de ${participant.user.name} atualizadas para ${newExacts}.`;
        break;
      }

      // 3. Destravar Palpites (Permitir ao cliente reenviar/editar)
      case "RESET_PREDICTIONS": {
        await prisma.prediction.updateMany({
          where: { participantId },
          data: { isLocked: false },
        });
        message = `Palpites de ${participant.user.name} foram destravados com sucesso! O jogador agora pode editar na tela dele.`;
        break;
      }

      // 4. Alterar Status de Pagamento (Pago, Pendente, Cancelado)
      case "CHANGE_STATUS": {
        const status = value || "PAID";
        await prisma.participant.update({
          where: { id: participantId },
          data: {
            paymentStatus: status,
            paidAt: status === "PAID" ? new Date() : null,
          },
        });
        message = `Status de inscrição de ${participant.user.name} alterado para ${status}.`;
        break;
      }

      // 5. Excluir Participante do Bolão
      case "DELETE": {
        // Exclui previsões e pagamentos vinculados
        await prisma.prediction.deleteMany({
          where: { participantId },
        });

        await prisma.participant.delete({
          where: { id: participantId },
        });

        await reorderTournamentRanking(participant.tournamentId);
        message = `Participante ${participant.user.name} removido do bolão com sucesso.`;
        break;
      }

      // 6. Editar Dados do Usuário (Nome, E-mail, Telefone/WhatsApp, Time e Pontos)
      case "UPDATE_USER_DATA": {
        const payload = userData || body;
        const { name, email, phone, favoriteTeam, totalPoints, exactScoresCount } = payload;

        const updateUserData: any = {};
        if (name && typeof name === "string" && name.trim()) {
          updateUserData.name = name.trim();
        }
        if (phone && typeof phone === "string" && phone.trim()) {
          updateUserData.phone = phone.trim();
        }
        if (favoriteTeam !== undefined) {
          updateUserData.favoriteTeam = favoriteTeam;
        }

        if (
          email &&
          typeof email === "string" &&
          email.trim().toLowerCase() !== participant.user.email.toLowerCase()
        ) {
          const existingUserWithEmail = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
          });
          if (existingUserWithEmail && existingUserWithEmail.id !== participant.userId) {
            return NextResponse.json(
              { error: "Este e-mail já está sendo utilizado por outro usuário." },
              { status: 400 }
            );
          }
          updateUserData.email = email.trim().toLowerCase();
        }

        if (Object.keys(updateUserData).length > 0) {
          await prisma.user.update({
            where: { id: participant.userId },
            data: updateUserData,
          });
        }

        const updateParticipantData: any = {};
        if (totalPoints !== undefined && totalPoints !== null) {
          updateParticipantData.totalPoints = Math.max(0, Number(totalPoints));
        }
        if (exactScoresCount !== undefined && exactScoresCount !== null) {
          updateParticipantData.exactScoresCount = Math.max(0, Number(exactScoresCount));
        }

        if (Object.keys(updateParticipantData).length > 0) {
          await prisma.participant.update({
            where: { id: participantId },
            data: updateParticipantData,
          });
          await reorderTournamentRanking(participant.tournamentId);
        }

        message = `Dados cadastrais e pontuação de ${updateUserData.name || participant.user.name} foram atualizados com sucesso!`;
        break;
      }

      default:
        return NextResponse.json({ error: `Ação inválida: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Erro na gestão do participante:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar ação no participante." },
      { status: 500 }
    );
  }
}
