"use client";
import { useEffect, useRef, useState } from "react";
import {
  X,
  Download,
  Share2,
  MessageCircle,
  Trophy,
  Sparkles,
  Check,
  Flame,
  Award,
} from "lucide-react";
import { BRAZILIAN_TEAMS, getTeamByName } from "@/lib/teams";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: {
    rankPosition?: number | null;
    totalPoints: number;
    exactScoresCount: number;
    user: {
      name: string;
      favoriteTeam?: string | null;
      avatar?: string | null;
    };
  };
  tournamentTitle: string;
}

export default function ShareCardModal({
  isOpen,
  onClose,
  participant,
  tournamentTitle,
}: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensões do Story / Status (1080 x 1920)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. Fundo Gradiente Arena Noturna
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      100,
      width / 2,
      height / 2,
      950
    );
    bgGradient.addColorStop(0, "#0d2818");
    bgGradient.addColorStop(0.4, "#06130d");
    bgGradient.addColorStop(1, "#030805");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Grid cibernético de futebol de fundo
    ctx.strokeStyle = "rgba(0, 230, 118, 0.08)";
    ctx.lineWidth = 2;
    const step = 80;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Círculo central estilizado de campo
    ctx.strokeStyle = "rgba(0, 230, 118, 0.15)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.45, 380, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Header do Bolão
    ctx.fillStyle = "#00e676";
    ctx.font = "bold 36px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "6px";
    ctx.fillText("BOLÃO PRO • LIGA OFICIAL", width / 2, 140);

    // Título do Bolão
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 52px 'Inter', sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText(tournamentTitle.toUpperCase(), width / 2, 220);

    // Linha divisória neon
    const lineGrad = ctx.createLinearGradient(width * 0.2, 0, width * 0.8, 0);
    lineGrad.addColorStop(0, "rgba(0, 230, 118, 0)");
    lineGrad.addColorStop(0.5, "#00e676");
    lineGrad.addColorStop(1, "rgba(0, 230, 118, 0)");
    ctx.fillStyle = lineGrad;
    ctx.fillRect(width * 0.2, 260, width * 0.6, 4);

    // 3. Card Principal do Jogador (Card Flutuante 3D)
    const cardX = 100;
    const cardY = 320;
    const cardW = 880;
    const cardH = 1200;
    const radius = 60;

    // Sombra do card
    ctx.shadowColor = "rgba(0, 230, 118, 0.35)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 20;

    // Fundo do Card
    ctx.fillStyle = "#0a1f14";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    // Borda Dourada / Neon
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 6;
    ctx.stroke();

    // 4. Badge de Posição (#1º LUGAR, etc.)
    const rank = participant.rankPosition || 1;
    const isTop1 = rank === 1;

    const badgeGrad = ctx.createLinearGradient(
      width / 2 - 200,
      cardY + 80,
      width / 2 + 200,
      cardY + 80
    );
    if (isTop1) {
      badgeGrad.addColorStop(0, "#ffd700");
      badgeGrad.addColorStop(1, "#ff9100");
    } else {
      badgeGrad.addColorStop(0, "#00e676");
      badgeGrad.addColorStop(1, "#00b0ff");
    }

    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 240, cardY + 60, 480, 100, 50);
    ctx.fill();

    ctx.fillStyle = "#030805";
    ctx.font = "900 48px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isTop1 ? "👑 1º LUGAR NO RANKING" : `🏆 ${rank}º LUGAR NO RANKING`, width / 2, cardY + 128);

    // 5. Nome do Jogador
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 68px 'Inter', sans-serif";
    ctx.fillText(participant.user.name, width / 2, cardY + 280);

    // Time do Coração
    const favTeam = participant.user.favoriteTeam || "Futebol Brasileiro";
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 38px 'Inter', sans-serif";
    ctx.fillText(`⚽ Torcedor do ${favTeam}`, width / 2, cardY + 360);

    // 6. Box de Pontuação Principal
    const boxX = cardX + 60;
    const boxY = cardY + 440;
    const boxW = cardW - 120;
    const boxH = 460;

    ctx.fillStyle = "#040d08";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 40);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 230, 118, 0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rótulo Pontos
    ctx.fillStyle = "#8ba294";
    ctx.font = "bold 32px 'Inter', sans-serif";
    ctx.fillText("PONTUAÇÃO OFICIAL ACUMULADA", width / 2, boxY + 80);

    // Número de Pontos GIGANTE
    ctx.fillStyle = "#00e676";
    ctx.font = "900 150px 'Inter', sans-serif";
    ctx.fillText(`${participant.totalPoints}`, width / 2, boxY + 240);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px 'Inter', sans-serif";
    ctx.fillText("PONTOS", width / 2, boxY + 300);

    // Linha interna
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 40, boxY + 340);
    ctx.lineTo(boxX + boxW - 40, boxY + 340);
    ctx.stroke();

    // Cravadas e Eficiência
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 38px 'Inter', sans-serif";
    ctx.fillText(
      `🎯 ${participant.exactScoresCount} Placares Cravados Exatos`,
      width / 2,
      boxY + 405
    );

    // Provocação amigável pro Stories
    ctx.fillStyle = "#e0e0e0";
    ctx.font = "italic 38px 'Inter', sans-serif";
    ctx.fillText("Será que alguém consegue me passar?", width / 2, cardY + 990);
    ctx.fillText("Faça seus palpites e venha disputar o Pix!", width / 2, cardY + 1050);

    // 7. Rodapé com Link / Chamada
    ctx.fillStyle = "#00e676";
    ctx.font = "900 46px 'Inter', sans-serif";
    ctx.fillText("ACESSE: BOLAOPRO.COM.BR", width / 2, height - 200);

    ctx.fillStyle = "#8ba294";
    ctx.font = "500 32px 'Inter', sans-serif";
    ctx.fillText("Pagamento instantâneo via Pix • Apuração em tempo real", width / 2, height - 130);

    // Converte o canvas para imagem data URL
    const url = canvas.toDataURL("image/png");
    setImageUrl(url);
  }, [isOpen, participant, tournamentTitle]);

  if (!isOpen) return null;

  function handleDownload() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `bolao-ranking-${participant.user.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  }

  async function handleShareMobile() {
    const text = `⚽ Olha minha posição no ranking do Bolão dos Cria: ${participant.rankPosition || 1}º Lugar com ${participant.totalPoints} pontos! Duvido você me passar: ${window.location.origin}`;

    if (navigator.share && imageUrl) {
      try {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], "meu-ranking-bolao.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Meu Desempenho no Bolão dos Cria",
            text,
            files: [file],
          });
          return;
        }
      } catch (err) {
        console.log("Fallback para download:", err);
      }
    }

    // Fallback: faz download e abre WhatsApp
    handleDownload();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-arena-900 border border-arena-700 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-6">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-arena-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-gold-500" />
          <h3 className="font-extrabold text-white text-base sm:text-lg">
            Figurinha Oficial do Ranking
          </h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Gere a imagem personalizada do seu ranking para postar no Status do WhatsApp ou Stories do Instagram!
        </p>

        {/* Canvas invisível para renderização em alta resolução */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Pré-visualização da Imagem */}
        <div className="w-full max-h-[380px] rounded-2xl overflow-hidden border border-pitch-green/30 shadow-glow bg-black flex items-center justify-center mb-5 relative group">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Card do Ranking"
              className="w-full h-full object-contain max-h-[380px]"
            />
          ) : (
            <div className="py-20 text-gray-400 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-500 animate-spin" />
              <span>Gerando sua figurinha do ranking...</span>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2.5">
          <button
            onClick={handleShareMobile}
            className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-arena-950 font-black rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-glow active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-arena-950" />
            <span>Compartilhar Imagem no WhatsApp</span>
          </button>

          <button
            onClick={handleDownload}
            className="w-full py-3 px-4 bg-arena-800 hover:bg-arena-750 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 border border-arena-700 active:scale-95"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-pitch-green stroke-[3]" />
                <span className="text-pitch-green">Imagem Salva no seu Celular!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-gold-400" />
                <span>Baixar Foto em Alta Definição (PNG)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
