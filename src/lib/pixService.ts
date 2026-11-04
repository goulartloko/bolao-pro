import { MercadoPagoConfig, Payment } from "mercadopago";
import QRCode from "qrcode";
import { prisma } from "./prisma";

export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const IS_SIMULATOR_ENABLED = process.env.ENABLE_PIX_SIMULATOR !== "false";

// Instância do SDK Mercado Pago
function getMercadoPagoClient() {
  if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.startsWith("TEST-00000000")) {
    return null;
  }
  return new MercadoPagoConfig({
    accessToken: MP_ACCESS_TOKEN,
    options: { timeout: 7000 },
  });
}

export interface CreatePixParams {
  userId: string;
  tournamentId: string;
  amount: number;
  description: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
}

export interface PixResponse {
  paymentId: string;
  providerPaymentId: string;
  status: PaymentStatus;
  amount: number;
  qrCodeBase64: string;
  qrCodeCopyPaste: string;
  ticketUrl?: string;
  isMock: boolean;
  expiresAt: Date;
}

/**
 * Cria uma cobrança Pix via Mercado Pago API ou Simulador Local
 */
export async function createPixPayment(params: CreatePixParams): Promise<PixResponse> {
  const { userId, tournamentId, amount, description, userEmail, userName } = params;

  // Garante que o usuário tem um registro de Participant criado
  let participant = await prisma.participant.findUnique({
    where: {
      userId_tournamentId: {
        userId,
        tournamentId,
      },
    },
  });

    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          userId,
          tournamentId,
          paymentStatus: amount <= 0 ? "PAID" : "PENDING",
          paidAt: amount <= 0 ? new Date() : null,
        },
      });
    }

    // Se o bolão for GRATUITO (edição promocional para atrair clientes)
    if (amount <= 0) {
      const now = new Date();
      if (participant.paymentStatus !== "PAID") {
        await prisma.participant.update({
          where: { id: participant.id },
          data: {
            paymentStatus: "PAID",
            paidAt: now,
          },
        });
      }

      const freePayment = await prisma.payment.create({
        data: {
          userId,
          tournamentId,
          participantId: participant.id,
          provider: "FREE_PROMO",
          providerPaymentId: `FREE_${Date.now()}_${userId.slice(-4)}`,
          status: "PAID",
          amount: 0,
          paidAt: now,
        },
      });

      return {
        paymentId: freePayment.id,
        providerPaymentId: freePayment.providerPaymentId || freePayment.id,
        status: "PAID" as any,
        amount: 0,
        qrCodeBase64: "",
        qrCodeCopyPaste: "",
        ticketUrl: undefined,
        isMock: false,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
    }

  // Verifica se já existe um pagamento pendente recente (menos de 30 minutos)
  const existingPayment = await prisma.payment.findFirst({
    where: {
      userId,
      tournamentId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPayment && existingPayment.qrCodeCopyPaste && existingPayment.qrCodeBase64) {
    return {
      paymentId: existingPayment.id,
      providerPaymentId: existingPayment.providerPaymentId || existingPayment.id,
      status: existingPayment.status as any,
      amount: existingPayment.amount,
      qrCodeBase64: existingPayment.qrCodeBase64,
      qrCodeCopyPaste: existingPayment.qrCodeCopyPaste,
      ticketUrl: existingPayment.ticketUrl || undefined,
      isMock: existingPayment.provider === "SIMULATOR",
      expiresAt: existingPayment.expiresAt || new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  const mpClient = getMercadoPagoClient();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos de validade

  // Se o client do Mercado Pago estiver configurado com credenciais válidas
  if (mpClient && !IS_SIMULATOR_ENABLED) {
    try {
      const paymentApi = new Payment(mpClient);

      const splitName = userName.trim().split(" ");
      const firstName = splitName[0] || "Participante";
      const lastName = splitName.slice(1).join(" ") || "Bolao";

      const webhookUrl = `${APP_URL}/api/webhooks/mercadopago`;

      const response = await paymentApi.create({
        body: {
          transaction_amount: amount,
          description: description || `Inscrição no Bolão - ${userName}`,
          payment_method_id: "pix",
          notification_url: webhookUrl,
          payer: {
            email: userEmail,
            first_name: firstName,
            last_name: lastName,
          },
          date_of_expiration: expiresAt.toISOString(),
        },
      });

      const qrCodeData = response.point_of_interaction?.transaction_data;
      const providerPaymentId = String(response.id);

      const payment = await prisma.payment.create({
        data: {
          userId,
          tournamentId,
          participantId: participant.id,
          provider: "MERCADO_PAGO",
          providerPaymentId,
          status: "PENDING",
          amount,
          qrCodeBase64: qrCodeData?.qr_code_base64 || null,
          qrCodeCopyPaste: qrCodeData?.qr_code || null,
          ticketUrl: qrCodeData?.ticket_url || null,
          expiresAt,
        },
      });

      return {
        paymentId: payment.id,
        providerPaymentId,
        status: payment.status as any,
        amount: payment.amount,
        qrCodeBase64: payment.qrCodeBase64 || "",
        qrCodeCopyPaste: payment.qrCodeCopyPaste || "",
        ticketUrl: payment.ticketUrl || undefined,
        isMock: false,
        expiresAt,
      };
    } catch (error) {
      console.warn("Mercado Pago API falhou ou credencial de teste não autorizada. Acionando fallback do simulador:", error);
    }
  }

  // --- MODO SIMULADOR RESILIENTE (Para testes e contingência) ---
  const simulatedProviderId = `SIM_PIX_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const simulatedPixCopyPaste = `00020126580014br.gov.bcb.pix0136${userId}520400005303986540${amount.toFixed(2)}5802BR5916BOLAO_SAAS_PRO6009SAO_PAULO62070503***6304ABCD`;

  // Gera QR Code visual em base64 usando a biblioteca 'qrcode'
  const qrCodeDataUrl = await QRCode.toDataURL(simulatedPixCopyPaste, {
    margin: 1,
    width: 280,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Remove o prefixo "data:image/png;base64," para manter o mesmo padrão da API do Mercado Pago
  const qrCodeCleanBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

  const payment = await prisma.payment.create({
    data: {
      userId,
      tournamentId,
      participantId: participant.id,
      provider: "SIMULATOR",
      providerPaymentId: simulatedProviderId,
      status: "PENDING",
      amount,
      qrCodeBase64: qrCodeCleanBase64,
      qrCodeCopyPaste: simulatedPixCopyPaste,
      expiresAt,
    },
  });

  return {
    paymentId: payment.id,
    providerPaymentId: simulatedProviderId,
    status: payment.status as any,
    amount: payment.amount,
    qrCodeBase64: qrCodeCleanBase64,
    qrCodeCopyPaste: simulatedPixCopyPaste,
    ticketUrl: undefined,
    isMock: true,
    expiresAt,
  };
}

/**
 * Aprova instantaneamente o pagamento e libera a inscrição do usuário no Bolão
 */
export async function approvePayment(paymentIdOrProviderId: string, rawData?: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: paymentIdOrProviderId },
        { providerPaymentId: paymentIdOrProviderId },
      ],
    },
    include: {
      participant: true,
    },
  });

  if (!payment) {
    throw new Error(`Pagamento não encontrado: ${paymentIdOrProviderId}`);
  }

  if (payment.status === "PAID") {
    return { alreadyPaid: true, payment };
  }

  const now = new Date();

  // 1. Atualiza o pagamento para PAID
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      paidAt: now,
      rawWebhookData: rawData || undefined,
    },
  });

  // 2. Atualiza a inscrição do participante para PAID
  if (payment.participantId) {
    await prisma.participant.update({
      where: { id: payment.participantId },
      data: {
        paymentStatus: "PAID",
        paidAt: now,
      },
    });
  } else {
    // Garante que o participante seja encontrado ou criado
    await prisma.participant.upsert({
      where: {
        userId_tournamentId: {
          userId: payment.userId,
          tournamentId: payment.tournamentId,
        },
      },
      update: {
        paymentStatus: "PAID",
        paidAt: now,
      },
      create: {
        userId: payment.userId,
        tournamentId: payment.tournamentId,
        paymentStatus: "PAID",
        paidAt: now,
      },
    });
  }

  return { success: true, payment: updatedPayment };
}
