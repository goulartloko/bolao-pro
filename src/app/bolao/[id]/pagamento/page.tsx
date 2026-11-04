"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  QrCode,
  Copy,
  Check,
  Zap,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import AuthModal from "@/components/AuthModal";

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Gera ou carrega o Pix
  async function loadOrCreatePix() {
    setGenerating(true);
    setError(null);

    try {
      // Verifica se está logado
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.authenticated) {
        setAuthOpen(true);
        setGenerating(false);
        setLoading(false);
        return;
      }

      // Se já estiver pago, redireciona para a tela de palpites!
      if (meData.participantStatus === "PAID") {
        setIsPaid(true);
        router.push(`/bolao/${tournamentId}/palpites`);
        return;
      }

      // Chama a API para criar cobrança Pix
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar cobrança Pix.");
      }

      setPixData(data.pix);

      // Se a inscrição for gratuita (edição promocional)
      if (data.pix?.amount <= 0 || data.pix?.status === "PAID") {
        setIsPaid(true);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          router.push(`/bolao/${tournamentId}/palpites`);
        }, 1500);
        return;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrCreatePix();
  }, [tournamentId]);

  // 2. Polling para verificar em tempo real se o Pix foi pago
  useEffect(() => {
    if (!pixData || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?paymentId=${pixData.paymentId}`);
        const data = await res.json();

        if (data.isPaid) {
          setIsPaid(true);
          clearInterval(interval);

          // Efeito de confete ao aprovar
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Redireciona após 2 segundos
          setTimeout(() => {
            router.push(`/bolao/${tournamentId}/palpites`);
          }, 2000);
        }
      } catch (err) {
        console.error("Erro no polling de status:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pixData, isPaid, router, tournamentId]);

  // Função para copiar código Pix Copia e Cola
  async function handleCopyPix() {
    if (!pixData?.qrCodeCopyPaste) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCodeCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback manual
      setCopied(true);
    }
  }

  // Função para simular aprovação imediata (teste local)
  async function handleSimulateApproval() {
    if (!pixData?.paymentId) return;
    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: pixData.paymentId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaid(true);
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          router.push(`/bolao/${tournamentId}/palpites`);
        }, 1500);
      }
    } catch (err) {
      console.error("Erro ao simular aprovação:", err);
    }
  }

  if (loading || generating) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-pitch-green animate-spin mb-4" />
        <p className="text-gray-300 text-sm font-medium">Gerando QR Code Pix seguro...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* CARD PRINCIPAL DE PAGAMENTO */}
      <div className="bg-arena-900 border border-arena-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pitch-green/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-pitch-green/10 text-pitch-green mb-3 border border-pitch-green/20">
            <Zap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Pagamento da Inscrição
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Pague via Pix para desbloquear sua tela de palpites instantaneamente.
          </p>
        </div>

        {isPaid ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-pitch-green/20 text-pitch-green rounded-full flex items-center justify-center mx-auto mb-4 border border-pitch-green/30">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Pagamento Confirmado!</h2>
            <p className="text-xs text-gray-400 mb-6">
              Sua vaga está garantida. Redirecionando para seus palpites...
            </p>
            <button
              onClick={() => router.push(`/bolao/${tournamentId}/palpites`)}
              className="py-3 px-6 bg-pitch-green text-arena-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 mx-auto"
            >
              <span>Acessar Palpites Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Valor do Pix */}
            <div className="bg-arena-850 border border-arena-750 rounded-2xl p-4 text-center mb-6">
              <span className="text-xs text-gray-400 block mb-1">Valor Total a Pagar</span>
              <div className="text-3xl font-black text-pitch-green font-mono">
                R$ {pixData?.amount?.toFixed(2)?.replace(".", ",") || "10,00"}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-2">
                <Clock className="w-3.5 h-3.5 text-gold-500 animate-pulse" />
                <span>Aguardando transferência via Pix...</span>
              </div>
            </div>

            {/* QR CODE VISUAL */}
            {pixData?.qrCodeBase64 && (
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="p-3 bg-white rounded-2xl shadow-lg border border-gray-200">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <span className="text-[11px] text-gray-400 mt-2">
                  Abra o app do seu banco e escaneie o código
                </span>
              </div>
            )}

            {/* PIX COPIA E COLA */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Código Pix Copia e Cola:
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={pixData?.qrCodeCopyPaste || ""}
                  className="w-full pl-3 pr-28 py-3 bg-arena-850 border border-arena-700 rounded-xl text-xs text-gray-300 font-mono focus:outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-pitch-green hover:bg-pitch-light text-arena-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* BOTÃO DE SIMULAÇÃO DE TESTE RÁPIDO */}
            <div className="pt-4 border-t border-arena-800">
              <button
                type="button"
                onClick={handleSimulateApproval}
                className="w-full py-2.5 px-4 bg-arena-800/80 hover:bg-arena-750 text-gold-400 text-xs font-semibold rounded-xl border border-gold-500/20 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-gold-500" />
                <span>Simular Aprovação Instantânea (Modo Teste)</span>
              </button>
              <p className="text-[10px] text-gray-500 text-center mt-1.5">
                Clique acima para homologar o fluxo imediatamente sem custo real.
              </p>
            </div>
          </>
        )}
      </div>

      {/* DICAS DE SEGURANÇA */}
      <div className="mt-6 flex items-start gap-3 p-4 bg-arena-900/60 border border-arena-800 rounded-2xl text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-pitch-green shrink-0 mt-0.5" />
        <p>
          O sistema processa a confirmação de forma 100% automática através de Webhook bancário integrado. Assim que seu banco autorizar, sua tela de palpites abre na hora!
        </p>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => loadOrCreatePix()}
      />
    </div>
  );
}
