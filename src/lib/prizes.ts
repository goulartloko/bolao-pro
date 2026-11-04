export interface ParsedPrizes {
  firstPlace: string;
  secondPlace: string;
  thirdPlace?: string | null;
}

/**
 * Extrai os valores de premiação para 1º e 2º lugar a partir da descrição e pool do bolão.
 * Suporta formatos como:
 * - "1º Lugar: R$ 50,00   2º Lugar: R$ 30,00"
 * - "1º Lugar: R$ 350,00 | 2º Lugar: R$ 100,00 | 3º Lugar: R$ 50,00"
 * - "1º Lugar: 70% | 2º Lugar: 30%"
 */
export function parsePrizes(prizeDescription?: string | null, prizePool: number = 0): ParsedPrizes {
  let firstPlace: string | null = null;
  let secondPlace: string | null = null;
  let thirdPlace: string | null = null;

  if (prizeDescription) {
    const p1Match = prizeDescription.match(/(?:1[º°]|primeiro)[^:]*:\s*(R\$\s*[\d,.]+|\d+%\s*|[\d,.]+)/i);
    if (p1Match) firstPlace = p1Match[1].trim();

    const p2Match = prizeDescription.match(/(?:2[º°]|segundo)[^:]*:\s*(R\$\s*[\d,.]+|\d+%\s*|[\d,.]+)/i);
    if (p2Match) secondPlace = p2Match[1].trim();

    const p3Match = prizeDescription.match(/(?:3[º°]|terceiro)[^:]*:\s*(R\$\s*[\d,.]+|\d+%\s*|[\d,.]+)/i);
    if (p3Match) thirdPlace = p3Match[1].trim();
  }

  // Converte porcentagem se presente
  const calcPercent = (val: string | null) => {
    if (val && val.includes("%") && prizePool > 0) {
      const pct = parseFloat(val) / 100;
      return "R$ " + (prizePool * pct).toFixed(2).replace(".", ",");
    }
    return val;
  };

  firstPlace = calcPercent(firstPlace);
  secondPlace = calcPercent(secondPlace);
  thirdPlace = calcPercent(thirdPlace);

  // Formata com R$ se for número puro
  const formatPrize = (val: string | null) => {
    if (!val) return null;
    val = val.trim();
    if (!val.startsWith("R$") && !val.includes("%")) {
      return "R$ " + val;
    }
    return val;
  };

  firstPlace = formatPrize(firstPlace);
  secondPlace = formatPrize(secondPlace);
  thirdPlace = formatPrize(thirdPlace);

  // Fallbacks inteligentes
  if (!firstPlace && prizePool > 0) {
    firstPlace = "R$ " + prizePool.toFixed(2).replace(".", ",");
  }
  if (!firstPlace) firstPlace = "R$ 50,00";
  if (!secondPlace) secondPlace = "R$ 30,00";

  return { firstPlace, secondPlace, thirdPlace };
}
