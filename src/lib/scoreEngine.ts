import { prisma } from "./prisma";

export type ScoreTypeAwarded = "NONE" | "EXACT" | "WINNER_WITH_DIFF" | "WINNER_ONLY" | "PARTIAL";

export interface ScoreRules {
  exactScorePoints: number; // Ex: 10
  winnerPoints: number; // Ex: 5
  goalDiffPoints: number; // Ex: 2
}

export interface ScoreResult {
  points: number;
  scoreType: ScoreTypeAwarded;
  isExact: boolean;
  correctWinner: boolean;
  correctGoalDiff: boolean;
}

/**
 * Calcula a pontuação de um palpite individual frente ao placar oficial e regras do bolão.
 */
export function calculatePredictionScore(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number,
  rules: ScoreRules
): ScoreResult {
  // 1. Caso Placar Exato (ex: Cravou 2 x 1)
  if (predHome === realHome && predAway === realAway) {
    return {
      points: rules.exactScorePoints,
      scoreType: "EXACT",
      isExact: true,
      correctWinner: true,
      correctGoalDiff: true,
    };
  }

  // Determinação dos resultados: Vencedor Mandante (1), Visitante (2) ou Empate (X)
  const realOutcome =
    realHome > realAway ? "HOME" : realHome < realAway ? "AWAY" : "DRAW";
  const predOutcome =
    predHome > predAway ? "HOME" : predHome < predAway ? "AWAY" : "DRAW";

  // Se acertou o vencedor ou empate
  if (realOutcome === predOutcome) {
    const realDiff = realHome - realAway;
    const predDiff = predHome - predAway;

    // Se além do vencedor, acertou também o saldo de gols (ex: 3x1 e palpitou 2x0 -> saldo de +2)
    if (realDiff === predDiff) {
      return {
        points: rules.winnerPoints + rules.goalDiffPoints,
        scoreType: "WINNER_WITH_DIFF",
        isExact: false,
        correctWinner: true,
        correctGoalDiff: true,
      };
    }

    // Apenas vencedor/empate
    return {
      points: rules.winnerPoints,
      scoreType: "WINNER_ONLY",
      isExact: false,
      correctWinner: true,
      correctGoalDiff: false,
    };
  }

  // Não pontuou
  return {
    points: 0,
    scoreType: "NONE",
    isExact: false,
    correctWinner: false,
    correctGoalDiff: false,
  };
}

/**
 * Processa e recalcula automaticamente as pontuações de todos os palpites de uma partida,
 * atualizando os pontos acumulados de cada participante e reorganizando o ranking em tempo real.
 */
export async function processMatchScores(matchId: string) {
  // 1. Busca a partida e o bolão com as regras
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      predictions: true,
    },
  });

  if (!match) {
    throw new Error(`Partida não encontrada para o ID: ${matchId}`);
  }

  if (match.homeScore === null || match.awayScore === null) {
    throw new Error("A partida precisa ter os placares de mandante e visitante preenchidos.");
  }

  const { homeScore: realHome, awayScore: realAway, tournament } = match;
  const rules: ScoreRules = {
    exactScorePoints: tournament.exactScorePoints,
    winnerPoints: tournament.winnerPoints,
    goalDiffPoints: tournament.goalDiffPoints,
  };

  // 2. Atualiza cada palpite da partida
  for (const pred of match.predictions) {
    const result = calculatePredictionScore(
      pred.homeScore,
      pred.awayScore,
      realHome,
      realAway,
      rules
    );

    await prisma.prediction.update({
      where: { id: pred.id },
      data: {
        pointsEarned: result.points,
        scoreType: result.scoreType,
        isLocked: true,
      },
    });
  }

  // 3. Atualiza os totais e placares exatos de cada participante no torneio
  const participants = await prisma.participant.findMany({
    where: { tournamentId: tournament.id },
    include: {
      predictions: true,
    },
  });

  for (const part of participants) {
    let totalPoints = 0;
    let exactScoresCount = 0;
    let winnerPicksCount = 0;

    for (const pred of part.predictions) {
      totalPoints += pred.pointsEarned;
      if (pred.scoreType === "EXACT") {
        exactScoresCount += 1;
      }
      if (pred.scoreType === "EXACT" || pred.scoreType === "WINNER_WITH_DIFF" || pred.scoreType === "WINNER_ONLY") {
        winnerPicksCount += 1;
      }
    }

    await prisma.participant.update({
      where: { id: part.id },
      data: {
        totalPoints,
        exactScoresCount,
        winnerPicksCount,
      },
    });
  }

  // 4. Reordena e define as posições no ranking
  // Critério de desempate:
  // 1º Pontos Totais (DESC)
  // 2º Quantidade de Placares Exatos (DESC)
  // 3º Quantidade de Vencedores Acertados (DESC)
  const rankedParticipants = await prisma.participant.findMany({
    where: { tournamentId: tournament.id },
    orderBy: [
      { totalPoints: "desc" },
      { exactScoresCount: "desc" },
      { winnerPicksCount: "desc" },
      { createdAt: "asc" },
    ],
  });

  for (let index = 0; index < rankedParticipants.length; index++) {
    const part = rankedParticipants[index];
    await prisma.participant.update({
      where: { id: part.id },
      data: {
        rankPosition: index + 1,
      },
    });
  }

  // 5. Marca o status da partida como FINISHED
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "FINISHED" },
  });

  return {
    success: true,
    processedPredictions: match.predictions.length,
    updatedParticipants: rankedParticipants.length,
  };
}
