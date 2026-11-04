import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.ARMAZENAR_URL ||
    process.env.STORAGE_URL ||
    process.env.ARMAZENAR_PRISMA_URL ||
    "";
}

const prisma = new PrismaClient();

export const REAL_MATCHES_CATALOG = {
  "QUARTA_DECISIVA": {
    title: "Brasileirão Série A - 34ª Rodada (Jogos Não Iniciados)",
    description: "Rodada 100% Gratuita de Lançamento! Palpite nos confrontos decisivos não iniciados da 34ª Rodada do Brasileirão Série A e dispute a liderança do ranking!",
    entryFee: 0.0,
    prizePool: 500.0,
    prizeDescription: "1º Lugar: R$ 350,00 | 2º Lugar: R$ 100,00 | 3º Lugar: R$ 50,00 via Pix",
    deadline: "2026-11-04T19:29:00-03:00",
    startDate: "2026-11-04T19:30:00-03:00",
    endDate: "2026-11-06T23:59:00-03:00",
    matches: [
      {
        homeTeam: "Flamengo",
        awayTeam: "Grêmio",
        stadium: "Estádio do Maracanã, Rio de Janeiro (RJ)",
        matchDate: "2026-11-04T19:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Athletico-PR",
        awayTeam: "Vasco",
        stadium: "Ligga Arena, Curitiba (PR)",
        matchDate: "2026-11-04T19:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Botafogo",
        awayTeam: "Atlético-MG",
        stadium: "Estádio Nilton Santos, Rio de Janeiro (RJ)",
        matchDate: "2026-11-04T21:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "São Paulo",
        awayTeam: "Corinthians",
        stadium: "MorumBIS, São Paulo (SP)",
        matchDate: "2026-11-04T21:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Palmeiras",
        awayTeam: "Remo",
        stadium: "Allianz Parque, São Paulo (SP)",
        matchDate: "2026-11-05T19:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Cruzeiro",
        awayTeam: "Bahia",
        stadium: "Estádio Mineirão, Belo Horizonte (MG)",
        matchDate: "2026-11-05T21:30:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Vitória",
        awayTeam: "Fluminense",
        stadium: "Estádio Barradão, Salvador (BA)",
        matchDate: "2026-11-06T20:00:00-03:00",
        roundNumber: 34,
      },
      {
        homeTeam: "Chapecoense",
        awayTeam: "Mirassol",
        stadium: "Arena Condá, Chapecó (SC)",
        matchDate: "2026-11-06T20:00:00-03:00",
        roundNumber: 34,
      },
    ],
  },
  "LA_LIGA_R12": {
    title: "La Liga 2026/27 - Rodada 12 Oficial",
    description: "Palpite nos maiores clássicos do futebol espanhol com Atlético de Madrid x Barcelona e Valencia x Real Madrid!",
    entryFee: 0.0,
    prizePool: 500.0,
    prizeDescription: "1º Lugar: R$ 350,00 | 2º Lugar: R$ 100,00 | 3º Lugar: R$ 50,00 via Pix",
    deadline: "2026-11-06T16:59:00-03:00",
    startDate: "2026-11-06T17:00:00-03:00",
    endDate: "2026-11-08T20:00:00-03:00",
    matches: [
      {
        homeTeam: "Sevilla",
        awayTeam: "Deportivo Alavés",
        stadium: "Estádio Ramón Sánchez-Pizjuán, Sevilha",
        matchDate: "2026-11-06T17:00:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Osasuna",
        awayTeam: "Athletic Club",
        stadium: "Estádio El Sadar, Pamplona",
        matchDate: "2026-11-07T14:30:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Valencia",
        awayTeam: "Real Madrid",
        stadium: "Estádio de Mestalla, Valência",
        matchDate: "2026-11-07T17:00:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Elche",
        awayTeam: "Real Betis",
        stadium: "Estádio Manuel Martínez Valero, Elche",
        matchDate: "2026-11-08T10:00:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Real Sociedad",
        awayTeam: "Rayo Vallecano",
        stadium: "Reale Arena, San Sebastián",
        matchDate: "2026-11-08T12:15:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Villarreal",
        awayTeam: "Getafe",
        stadium: "Estadio de la Cerámica, Villarreal",
        matchDate: "2026-11-08T14:30:00-03:00",
        roundNumber: 12,
      },
      {
        homeTeam: "Atlético de Madrid",
        awayTeam: "Barcelona",
        stadium: "Estádio Cívitas Metropolitano, Madri",
        matchDate: "2026-11-08T17:00:00-03:00",
        roundNumber: 12,
      },
    ],
  },
};

async function main() {
  console.log("⚽ Iniciando seed com jogos oficiais de amanhã (Brasileirão e Champions League)...");

  // 1. Criar/Garantir Usuário Admin (Goulart)
  const goulartPassword = await bcrypt.hash("Wclm1809", 10);
  const admin = await prisma.user.upsert({
    where: { email: "goulart@bolao.com" },
    update: {
      passwordHash: goulartPassword,
      role: "ADMIN",
      name: "Goulart (Admin)",
    },
    create: {
      name: "Goulart (Admin)",
      email: "goulart@bolao.com",
      phone: "11988887777",
      passwordHash: goulartPassword,
      role: "ADMIN",
      pixKey: "goulart@bolao.com",
      pixKeyType: "EMAIL",
    },
  });
  console.log("✅ Usuário Admin Goulart pronto:", admin.email);

  await prisma.user.upsert({
    where: { email: "admin@bolao.com" },
    update: { passwordHash: goulartPassword },
    create: {
      name: "Administrador Bolão",
      email: "admin@bolao.com",
      phone: "11988887777",
      passwordHash: goulartPassword,
      role: "ADMIN",
      pixKey: "admin@bolao.com",
      pixKeyType: "EMAIL",
    },
  });

  // 2. Verificar se já existe um bolão ativo no banco de dados
  const existingActiveTournament = await prisma.tournament.findFirst({
    where: { isActive: true },
    include: { matches: true },
  });

  if (existingActiveTournament) {
    console.log(`🔒 [Seed Seguro] Bolão ativo já existente encontrado: "${existingActiveTournament.title}" (ID: ${existingActiveTournament.id}).`);
    console.log(`🔒 [Seed Seguro] Preservando clientes reais, palpites, pontuações e premiação customizada (R$ ${existingActiveTournament.prizePool}). Nenhuma alteração destrutiva realizada.`);
    return;
  }

  // 3. Criar/Garantir Jogadores de Teste com Times do Coração
  const playersData = [
    { name: "Lucas Ferreira", email: "lucas@exemplo.com", phone: "11999991111", favoriteTeam: "Flamengo" },
    { name: "Mariana Souza", email: "mariana@exemplo.com", phone: "21988882222", favoriteTeam: "Palmeiras" },
    { name: "Gabriel Santos", email: "gabriel@exemplo.com", phone: "31977773333", favoriteTeam: "São Paulo" },
    { name: "Renata Alves", email: "renata@exemplo.com", phone: "41966664444", favoriteTeam: "Corinthians" },
    { name: "Felipe Costa", email: "felipe@exemplo.com", phone: "51955555555", favoriteTeam: "Grêmio" },
  ];

  const defaultPassword = await bcrypt.hash("123456", 10);
  const createdPlayers = [];

  for (const p of playersData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        favoriteTeam: p.favoriteTeam,
      },
      create: {
        name: p.name,
        email: p.email,
        phone: p.phone,
        passwordHash: defaultPassword,
        role: "PLAYER",
        pixKey: p.phone,
        pixKeyType: "TELEFONE",
        favoriteTeam: p.favoriteTeam,
      },
    });
    createdPlayers.push(user);
  }

  // 4. Desativar bolões antigos (apenas se não houver bolão ativo prévio)
  await prisma.tournament.updateMany({
    data: { isActive: false },
  });

  // 4. Criar o Bolão Ativo para Quarta-Feira, 04/11/2026
  const data = REAL_MATCHES_CATALOG["QUARTA_DECISIVA"];

  const tournament = await prisma.tournament.create({
    data: {
      title: data.title,
      slug: `super-quarta-brasileirao-champions-${Date.now()}`,
      description: data.description,
      type: "ROUND_WEEKLY",
      status: "OPEN",
      isActive: true,
      entryFee: data.entryFee,
      prizePool: data.prizePool,
      prizeDescription: data.prizeDescription,
      exactScorePoints: 10,
      winnerPoints: 5,
      goalDiffPoints: 2,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      deadlinePredictions: new Date(data.deadline),
    },
  });
  console.log("✅ Bolão Ativo Criado:", tournament.title);

  // 5. Cadastrar Partidas Oficiais de Amanhã
  const createdMatches = [];
  for (const m of data.matches) {
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        stadium: m.stadium,
        matchDate: new Date(m.matchDate),
        roundNumber: m.roundNumber,
        status: "SCHEDULED",
      },
    });
    createdMatches.push(match);
  }
  console.log(`✅ ${createdMatches.length} Partidas Oficiais (Brasileirão + Champions League) cadastradas!`);

  // 6. Cadastrar Participantes e Palpites de Demonstração (Início com 0 pontos)
  const mockScores = [
    { points: 0, exacts: 0, winners: 0 },
    { points: 0, exacts: 0, winners: 0 },
    { points: 0, exacts: 0, winners: 0 },
    { points: 0, exacts: 0, winners: 0 },
    { points: 0, exacts: 0, winners: 0 },
  ];

  for (let i = 0; i < createdPlayers.length; i++) {
    const player = createdPlayers[i];
    const stat = mockScores[i];

    const participant = await prisma.participant.create({
      data: {
        userId: player.id,
        tournamentId: tournament.id,
        paymentStatus: "PAID",
        paidAt: new Date(),
        totalPoints: stat.points,
        exactScoresCount: stat.exacts,
        winnerPicksCount: stat.winners,
        rankPosition: i + 1,
      },
    });

    await prisma.payment.create({
      data: {
        userId: player.id,
        tournamentId: tournament.id,
        participantId: participant.id,
        provider: "FREE_PROMO",
        providerPaymentId: `FREE_QUARTA_${Date.now()}_${i}`,
        status: "PAID",
        amount: 0.0,
        paidAt: new Date(),
      },
    });

    for (const match of createdMatches) {
      await prisma.prediction.create({
        data: {
          participantId: participant.id,
          userId: player.id,
          matchId: match.id,
          homeScore: Math.floor(Math.random() * 3) + 1,
          awayScore: Math.floor(Math.random() * 2),
          isLocked: true,
        },
      });
    }
  }

  // 7. Mensagens Iniciais na Resenha
  await prisma.chatMessage.createMany({
    data: [
      {
        tournamentId: tournament.id,
        userId: createdPlayers[0].id,
        message: "Mengão vai amassar amanhã no Maraca! Quem discorda não entende nada de bola! ⚽🔥",
      },
      {
        tournamentId: tournament.id,
        userId: createdPlayers[1].id,
        message: "Cravei 2x1 no clássico paulista! Ninguém me tira do topo da tabela! 🚀",
      },
      {
        tournamentId: tournament.id,
        userId: createdPlayers[2].id,
        message: "Champions League de tarde e Brasileirão à noite... bora garantir essa premiação no Pix! 💰",
      },
    ],
  });
  console.log("💬 Mensagens de resenha criadas!");

  console.log("🎉 Seed finalizado com sucesso! Jogos de amanhã sincronizados.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
