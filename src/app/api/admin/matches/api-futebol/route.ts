import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { fetchRodadaApiFutebol, getUpcomingMatchesOnly } from "@/lib/apiFutebol";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    await requireAdmin(bearerToken);

    const body = await req.json().catch(() => ({}));
    const campeonatoId = body.campeonatoId ? parseInt(body.campeonatoId, 10) : 10;
    const rodadaNumber = body.rodada ? parseInt(body.rodada, 10) : 34;
    const apiKey = body.apiKey?.trim() || undefined;
    const onlyUpcoming = body.onlyUpcoming !== false; // Padrão: somente partidas não iniciadas

    // 1. Busca os jogos diretamente na API Futebol
    const partidas = onlyUpcoming
      ? await getUpcomingMatchesOnly(campeonatoId, rodadaNumber, apiKey)
      : (await fetchRodadaApiFutebol(campeonatoId, rodadaNumber, apiKey)).partidas || [];

    if (partidas.length === 0) {
      return NextResponse.json(
        {
          error: `Nenhuma partida não iniciada encontrada para a ${rodadaNumber}ª rodada. Todas as partidas desta rodada já ocorreram ou foram finalizadas. Tente sincronizar a próxima rodada!`,
        },
        { status: 400 }
      );
    }

    // 2. Localiza o bolão ativo
    const tournament = await prisma.tournament.findFirst({
      where: { isActive: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Nenhum bolão ativo encontrado." }, { status: 404 });
    }

    // 3. Substitui os jogos anteriores
    await prisma.prediction.deleteMany({
      where: { match: { tournamentId: tournament.id } },
    });
    await prisma.match.deleteMany({
      where: { tournamentId: tournament.id },
    });

    // 4. Calcula data limite (1 minuto antes do primeiro jogo não iniciado)
    const sortedDates = partidas
      .map((p) => new Date(p.data_realizacao_iso || `${p.data_realizacao}T19:00:00-03:00`))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const firstMatchDate = sortedDates[0] || new Date();
    const deadline = new Date(firstMatchDate.getTime() - 1 * 60 * 1000);

    const roundTitle = `Brasileirão Série A - ${rodadaNumber}ª Rodada Oficial (${partidas.length} Jogos)`;

    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        title: roundTitle,
        deadlinePredictions: deadline,
      },
    });

    // 5. Cadastra as partidas reais no banco
    const created = [];
    for (const p of partidas) {
      const matchDate = p.data_realizacao_iso
        ? new Date(p.data_realizacao_iso)
        : new Date();

      const stadiumName =
        p.estadio?.nome_popular ||
        (p.time_mandante.nome_popular === "Flamengo"
          ? "Maracanã, Rio de Janeiro"
          : p.time_mandante.nome_popular === "São Paulo"
          ? "MorumBIS, São Paulo"
          : p.time_mandante.nome_popular === "Palmeiras"
          ? "Allianz Parque, São Paulo"
          : p.time_mandante.nome_popular === "Corinthians"
          ? "Neo Química Arena, São Paulo"
          : p.time_mandante.nome_popular === "Botafogo"
          ? "Nilton Santos, Rio de Janeiro"
          : p.time_mandante.nome_popular === "Cruzeiro"
          ? "Mineirão, Belo Horizonte"
          : p.time_mandante.nome_popular === "Athletico-PR"
          ? "Ligga Arena, Curitiba"
          : "Estádio Oficial");

      const match = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          homeTeam: p.time_mandante.nome_popular,
          awayTeam: p.time_visitante.nome_popular,
          homeTeamLogo: p.time_mandante.escudo || null,
          awayTeamLogo: p.time_visitante.escudo || null,
          stadium: stadiumName,
          matchDate,
          roundNumber: rodadaNumber,
          status: "SCHEDULED",
        },
      });
      created.push(match);
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/bolao/[id]/palpites", "page");
      revalidatePath("/bolao/[id]/ranking", "page");
    } catch {
      // Ignora erro fora de contexto
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} partidas NÃO INICIADAS sincronizadas com sucesso diretamente da API Futebol!`,
      roundTitle,
      matches: created,
    });
  } catch (error: any) {
    console.error("Erro ao sincronizar via API Futebol:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao conectar à API Futebol." },
      { status: 500 }
    );
  }
}
