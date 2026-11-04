/**
 * Integração Oficial com API Futebol (api-futebol.com.br)
 */

export const API_FUTEBOL_LIVE_KEY =
  process.env.API_FUTEBOL_KEY || "live_dcdf4b3b26151b193246eff25a2c3d";

export const API_FUTEBOL_TEST_KEY =
  process.env.API_FUTEBOL_TEST_KEY || "test_b69d0e9a07ac65a9a9ff83ee0fdecb";

export interface ApiFutebolPartida {
  partida_id: number;
  placar: string;
  time_mandante: {
    time_id: number;
    nome_popular: string;
    sigla: string;
    escudo: string;
  };
  time_visitante: {
    time_id: number;
    nome_popular: string;
    sigla: string;
    escudo: string;
  };
  placar_mandante: number | null;
  placar_visitante: number | null;
  status: string; // 'agendado', 'andamento', 'finalizado'
  data_realizacao: string;
  hora_realizacao: string | null;
  data_realizacao_iso: string;
  estadio: {
    estadio_id: number;
    nome_popular: string;
  } | null;
}

export async function fetchRodadaApiFutebol(
  campeonatoId: number = 10,
  rodadaNumber: number = 34,
  apiKey?: string
): Promise<{ nome: string; partidas: ApiFutebolPartida[] }> {
  // Tenta com a chave fornecida, depois com a Live, depois Sandbox
  const keysToTry = [
    apiKey,
    API_FUTEBOL_LIVE_KEY,
    API_FUTEBOL_TEST_KEY,
  ].filter(Boolean) as string[];

  let lastError: any = null;

  for (const key of keysToTry) {
    try {
      const res = await fetch(
        `https://api.api-futebol.com.br/v1/campeonatos/${campeonatoId}/rodadas/${rodadaNumber}`,
        {
          headers: {
            Authorization: `Bearer ${key}`,
          },
          next: { revalidate: 60 },
        }
      );

      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = new Error(errData.message || `Erro HTTP ${res.status}`);
      }
    } catch (e: any) {
      lastError = e;
    }
  }

  throw lastError || new Error("Não foi possível consultar a API Futebol.");
}

/**
 * Retorna exclusivamente as partidas que AINDA NÃO FORAM INICIADAS (status 'agendado' e sem placar)
 */
export async function getUpcomingMatchesOnly(
  campeonatoId: number = 10,
  rodadaNumber: number = 34,
  apiKey?: string
): Promise<ApiFutebolPartida[]> {
  const rodada = await fetchRodadaApiFutebol(campeonatoId, rodadaNumber, apiKey);
  const now = new Date();

  return (rodada.partidas || []).filter((p) => {
    // Descarta partidas já finalizadas ou em andamento
    if (p.status !== "agendado") return false;
    // Descarta partidas com placar já registrado
    if (p.placar_mandante !== null || p.placar_visitante !== null) return false;

    // Se tiver data ISO, verifica se a data/hora é no futuro
    if (p.data_realizacao_iso) {
      const matchDate = new Date(p.data_realizacao_iso);
      if (!isNaN(matchDate.getTime()) && matchDate < now) {
        return false;
      }
    }

    return true;
  });
}
