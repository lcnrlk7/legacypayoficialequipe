import { sql } from "@/lib/db";

export type NotificationType = "deposit" | "withdrawal" | "transaction" | "pix" | "kyc" | "system" | "success" | "error" | "warning" | "info";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

/**
 * Cria uma notificacao no banco de dados para o usuario
 */
export async function createNotification({ userId, title, message, type }: CreateNotificationParams): Promise<void> {
  try {
    await sql`
      INSERT INTO user_notifications (id, user_id, title, message, type, read, created_at)
      VALUES (
        ${crypto.randomUUID()},
        ${userId},
        ${title},
        ${message},
        ${type},
        false,
        NOW()
      )
    `;
  } catch (error) {
    console.error("[Notifications] Erro ao criar notificacao:", error);
  }
}

/**
 * Notifica sobre um deposito/PIX recebido
 */
export async function notifyDeposit(userId: string, amount: number, description?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Deposito Recebido!",
    message: `Voce recebeu um deposito de ${formattedAmount}${description ? ` - ${description}` : ''}`,
    type: "deposit"
  });
}

/**
 * Notifica sobre uma cobranca PIX criada
 */
export async function notifyPixCreated(userId: string, amount: number, externalId: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Cobranca PIX Criada",
    message: `Cobranca de ${formattedAmount} criada. ID: ${externalId.substring(0, 8)}...`,
    type: "pix"
  });
}

/**
 * Notifica sobre um PIX pago
 */
export async function notifyPixPaid(userId: string, amount: number, payerName?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "PIX Recebido!",
    message: `Pagamento de ${formattedAmount} confirmado${payerName ? ` de ${payerName}` : ''}`,
    type: "deposit"
  });
}

/**
 * Notifica sobre um saque solicitado
 */
export async function notifyWithdrawalRequested(userId: string, amount: number, pixKey: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  const maskedKey = pixKey.length > 8 ? `${pixKey.substring(0, 4)}***${pixKey.substring(pixKey.length - 4)}` : pixKey;
  await createNotification({
    userId,
    title: "Saque Solicitado",
    message: `Saque de ${formattedAmount} para ${maskedKey} esta sendo processado`,
    type: "withdrawal"
  });
}

/**
 * Notifica sobre um saque aprovado/concluido
 */
export async function notifyWithdrawalCompleted(userId: string, amount: number, pixKey: string, endToEnd?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  const maskedKey = pixKey.length > 8 ? `${pixKey.substring(0, 4)}***${pixKey.substring(pixKey.length - 4)}` : pixKey;
  await createNotification({
    userId,
    title: "Saque Concluido!",
    message: `Saque de ${formattedAmount} enviado para ${maskedKey}${endToEnd ? `. ID: ${endToEnd.substring(0, 12)}...` : ''}`,
    type: "success"
  });
}

/**
 * Notifica sobre um saque que falhou
 */
export async function notifyWithdrawalFailed(userId: string, amount: number, reason?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Saque Falhou",
    message: `Seu saque de ${formattedAmount} falhou${reason ? `: ${reason}` : ''}. O valor foi devolvido ao seu saldo.`,
    type: "error"
  });
}

/**
 * Notifica sobre um saque pendente de aprovacao
 */
export async function notifyWithdrawalPending(userId: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Saque em Analise",
    message: `Seu saque de ${formattedAmount} esta aguardando aprovacao. Voce sera notificado quando for processado.`,
    type: "warning"
  });
}

/**
 * Notifica sobre transacao via API/integracao
 */
export async function notifyTransactionReceived(userId: string, amount: number, integrationName?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Transacao Recebida!",
    message: `Voce recebeu ${formattedAmount}${integrationName ? ` via ${integrationName}` : ''}`,
    type: "transaction"
  });
}

/**
 * Notifica sobre atualizacao de KYC
 */
export async function notifyKycStatus(userId: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
  const titles: Record<string, string> = {
    approved: "KYC Aprovado!",
    rejected: "KYC Rejeitado",
    pending: "KYC em Analise"
  };
  const messages: Record<string, string> = {
    approved: "Sua verificacao de identidade foi aprovada. Voce agora tem acesso completo a plataforma.",
    rejected: "Sua verificacao de identidade foi rejeitada. Entre em contato com o suporte para mais informacoes.",
    pending: "Seus documentos estao sendo analisados. Voce sera notificado quando a verificacao for concluida."
  };
  const types: Record<string, NotificationType> = {
    approved: "success",
    rejected: "error",
    pending: "warning"
  };
  await createNotification({
    userId,
    title: titles[status],
    message: messages[status],
    type: types[status]
  });
}
