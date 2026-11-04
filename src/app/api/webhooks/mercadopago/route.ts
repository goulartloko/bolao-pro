import { NextRequest, NextResponse } from "next/server";
import { approvePayment } from "@/lib/pixService";
import { MercadoPagoConfig, Payment } from "mercadopago";

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // O Mercado Pago pode enviar o ID do pagamento no corpo (type === 'payment' ou action === 'payment.created')
    // ou na query string (?data.id=... ou ?id=... ou ?topic=payment)
    const paymentId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    const topic = body?.type || body?.topic || url.searchParams.get("topic");

    console.log("Recebido Webhook do Mercado Pago:", { topic, paymentId });

    if (!paymentId) {
      return NextResponse.json({ message: "No payment ID found" }, { status: 200 });
    }

    // Se tivermos client oficial ativo, verificamos o status real na API do Mercado Pago
    let isApproved = true;

    if (MP_ACCESS_TOKEN && !MP_ACCESS_TOKEN.startsWith("TEST-00000000")) {
      try {
        const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
        const paymentApi = new Payment(client);
        const paymentInfo = await paymentApi.get({ id: String(paymentId) });

        console.log("Status retornado pela API do Mercado Pago:", paymentInfo.status);
        isApproved = paymentInfo.status === "approved";
      } catch (err) {
        console.error("Erro ao consultar status no Mercado Pago SDK:", err);
      }
    }

    if (isApproved) {
      await approvePayment(String(paymentId), JSON.stringify({ body, query: Object.fromEntries(url.searchParams) }));
      console.log(`Pagamento Pix #${paymentId} APROVADO com sucesso e usuário liberado no Bolão!`);
    }

    return NextResponse.json({ status: "success", received: true });
  } catch (error: any) {
    console.error("Erro ao processar Webhook do Mercado Pago:", error);
    // Retornamos 200 mesmo em erro de log para evitar reenvios infinitos do webhook durante falhas transitórias
    return NextResponse.json({ status: "error", message: error.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Mercado Pago Webhook Endpoint Active" });
}
