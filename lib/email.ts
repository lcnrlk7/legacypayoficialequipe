import { Resend } from "resend";

// Função para obter a instância do Resend
function getResend(): Resend {
  // Usar a API key diretamente para evitar problemas de cache de variáveis de ambiente
  const apiKey = "re_d6rdAK4W_3ZhUjLBsyzMvL88AKJjwX9JF";
  return new Resend(apiKey);
}

// Email oficial com domínio verificado
const FROM_EMAIL = "LegacyPay <noreply@legacypay.shop>";

// Logo da LegacyPay
const LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PhlbUzFfJZsj2u0IftrABCtiUFypLu.png";

// Cores da marca
const COLORS = {
  primary: "#FF6B00",
  primaryLight: "#FF8C00",
  primaryDark: "#E55A00",
  background: "#0a0a0a",
  cardBg: "#111111",
  cardBorder: "#1f1f1f",
  text: "#ffffff",
  textMuted: "#a1a1aa",
  textSubtle: "#71717a",
};

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  name?: string
): Promise<boolean> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, ${COLORS.cardBg} 0%, #0d0d0d 100%); border-radius: 24px; border: 1px solid ${COLORS.cardBorder}; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(255, 107, 0, 0.15);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; text-align: center; background: linear-gradient(180deg, rgba(255, 107, 0, 0.08) 0%, transparent 100%);">
              <img src="${LOGO_URL}" alt="LegacyPay" width="80" height="80" style="display: block; margin: 0 auto 24px auto; border-radius: 16px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: ${COLORS.primary};">Legacy</span><span style="color: ${COLORS.text};">Pay</span>
              </h1>
              <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px;">Sua plataforma de pagamentos</p>
            </td>
          </tr>

          <!-- Divisor gradiente -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 2px; background: linear-gradient(90deg, transparent, ${COLORS.primary}, transparent); border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Conteudo -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: ${COLORS.text}; font-size: 22px; font-weight: 600; text-align: center;">
                Verificação de Email
              </h2>
              <p style="margin: 0 0 32px 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.7; text-align: center;">
                ${name ? `Olá <strong style="color: ${COLORS.text};">${name}</strong>, ` : ""}para continuar com seu cadastro, utilize o código abaixo:
              </p>
              
              <!-- Codigo OTP - Alta visibilidade -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 3px solid ${COLORS.primary}; border-radius: 16px; box-shadow: 0 0 30px rgba(255, 107, 0, 0.25);">
                      <tr>
                        <td style="padding: 28px 40px; text-align: center;">
                          <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; opacity: 1 !important;">Seu código de verificação</p>
                          <table cellpadding="0" cellspacing="0" align="center">
                            <tr>
                              <td style="font-family: 'Courier New', Courier, monospace; font-size: 48px; font-weight: 700; color: #FF6B00 !important; letter-spacing: 16px; padding: 8px 16px; background-color: #0d0d0d; border-radius: 12px; border: 1px solid #333333; mso-line-height-rule: exactly; line-height: 56px;">${code}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Info expiracao -->
              <div style="background: rgba(255, 107, 0, 0.08); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px; text-align: center;">
                  ⏱️ Este código expira em <strong style="color: ${COLORS.primary};">10 minutos</strong>
                </p>
              </div>
              
              <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 13px; line-height: 1.6; text-align: center;">
                Se você não solicitou este código, pode ignorar este email com segurança.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%); border-top: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${COLORS.textSubtle}; font-size: 12px;">
                      © ${new Date().getFullYear()} LegacyPay. Todos os direitos reservados.
                    </p>
                    <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 11px;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Texto fora do card -->
        <p style="margin: 24px 0 0 0; color: ${COLORS.textSubtle}; font-size: 11px; text-align: center;">
          Enviado com 🧡 pela equipe LegacyPay
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${code} - Código de Verificação LegacyPay`,
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Erro ao enviar:", error);
      return false;
    }

    console.log("[Email] Código enviado com sucesso para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error);
    return false;
  }
}

export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<boolean> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, ${COLORS.cardBg} 0%, #0d0d0d 100%); border-radius: 24px; border: 1px solid ${COLORS.cardBorder}; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(255, 107, 0, 0.15);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; text-align: center; background: linear-gradient(180deg, rgba(255, 107, 0, 0.08) 0%, transparent 100%);">
              <img src="${LOGO_URL}" alt="LegacyPay" width="80" height="80" style="display: block; margin: 0 auto 24px auto; border-radius: 16px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: ${COLORS.primary};">Legacy</span><span style="color: ${COLORS.text};">Pay</span>
              </h1>
              <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px;">Sua plataforma de pagamentos</p>
            </td>
          </tr>

          <!-- Divisor gradiente -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 2px; background: linear-gradient(90deg, transparent, ${COLORS.primary}, transparent); border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Conteudo -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%); border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 28px; margin-bottom: 16px;">
                  🎉
                </div>
                <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 24px; font-weight: 600;">
                  Bem-vindo, ${name}!
                </h2>
                <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px;">
                  Sua conta foi criada com sucesso
                </p>
              </div>
              
              <p style="margin: 0 0 28px 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.7; text-align: center;">
                Agora você faz parte da LegacyPay! Estamos felizes em ter você conosco. Confira o que você pode fazer:
              </p>
              
              <!-- Features -->
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #141414 100%); border-radius: 16px; padding: 24px; margin-bottom: 28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.cardBorder};">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="40" style="color: ${COLORS.primary}; font-size: 20px;">💳</td>
                          <td style="color: ${COLORS.text}; font-size: 14px;">Receber pagamentos via PIX instantâneo</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.cardBorder};">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="40" style="color: ${COLORS.primary}; font-size: 20px;">📊</td>
                          <td style="color: ${COLORS.text}; font-size: 14px;">Acompanhar todas as suas transações</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.cardBorder};">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="40" style="color: ${COLORS.primary}; font-size: 20px;">💰</td>
                          <td style="color: ${COLORS.text}; font-size: 14px;">Sacar para sua conta bancária</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="40" style="color: ${COLORS.primary}; font-size: 20px;">🔒</td>
                          <td style="color: ${COLORS.text}; font-size: 14px;">Segurança e proteção em todas as operações</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="https://legacypay.shop/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);">
                  Acessar minha conta →
                </a>
              </div>
              
              <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 13px; line-height: 1.6; text-align: center;">
                Precisa de ajuda? Entre em contato com nosso suporte.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%); border-top: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${COLORS.textSubtle}; font-size: 12px;">
                      © ${new Date().getFullYear()} LegacyPay. Todos os direitos reservados.
                    </p>
                    <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 11px;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Texto fora do card -->
        <p style="margin: 24px 0 0 0; color: ${COLORS.textSubtle}; font-size: 11px; text-align: center;">
          Enviado com 🧡 pela equipe LegacyPay
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🎉 Bem-vindo à LegacyPay!",
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Erro ao enviar boas-vindas:", error);
      return false;
    }

    console.log("[Email] Email de boas-vindas enviado para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email de boas-vindas:", error);
    return false;
  }
}

export async function sendWithdrawalNotification(
  to: string,
  name: string,
  amount: number,
  status: "pending" | "approved" | "rejected" | "completed"
): Promise<boolean> {
  const statusConfig = {
    pending: {
      icon: "⏳",
      title: "Saque Solicitado",
      message: `Seu saque de <strong style="color: ${COLORS.primary};">R$ ${amount.toFixed(2)}</strong> foi recebido e está em análise.`,
      color: "#FFA500",
    },
    approved: {
      icon: "✅",
      title: "Saque Aprovado",
      message: `Seu saque de <strong style="color: ${COLORS.primary};">R$ ${amount.toFixed(2)}</strong> foi aprovado e será processado em breve.`,
      color: "#22c55e",
    },
    rejected: {
      icon: "❌",
      title: "Saque Recusado",
      message: `Infelizmente seu saque de <strong style="color: ${COLORS.primary};">R$ ${amount.toFixed(2)}</strong> não pôde ser processado. Entre em contato com o suporte.`,
      color: "#ef4444",
    },
    completed: {
      icon: "💸",
      title: "Saque Concluído",
      message: `Seu saque de <strong style="color: ${COLORS.primary};">R$ ${amount.toFixed(2)}</strong> foi enviado para sua conta PIX com sucesso!`,
      color: "#22c55e",
    },
  };

  const config = statusConfig[status];

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, ${COLORS.cardBg} 0%, #0d0d0d 100%); border-radius: 24px; border: 1px solid ${COLORS.cardBorder}; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(255, 107, 0, 0.15);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; text-align: center; background: linear-gradient(180deg, rgba(255, 107, 0, 0.08) 0%, transparent 100%);">
              <img src="${LOGO_URL}" alt="LegacyPay" width="80" height="80" style="display: block; margin: 0 auto 24px auto; border-radius: 16px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: ${COLORS.primary};">Legacy</span><span style="color: ${COLORS.text};">Pay</span>
              </h1>
              <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px;">Sua plataforma de pagamentos</p>
            </td>
          </tr>

          <!-- Divisor gradiente -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 2px; background: linear-gradient(90deg, transparent, ${COLORS.primary}, transparent); border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Conteudo -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 28px;">
                <div style="display: inline-block; font-size: 48px; margin-bottom: 16px;">
                  ${config.icon}
                </div>
                <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 22px; font-weight: 600;">
                  ${config.title}
                </h2>
              </div>
              
              <p style="margin: 0 0 24px 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.7; text-align: center;">
                Olá <strong style="color: ${COLORS.text};">${name}</strong>,
              </p>
              
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #141414 100%); border-left: 4px solid ${config.color}; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.7;">
                  ${config.message}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="https://legacypay.shop/dashboard/wallet" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);">
                  Ver detalhes →
                </a>
              </div>
              
              <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 13px; line-height: 1.6; text-align: center;">
                Dúvidas? Entre em contato com nosso suporte.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%); border-top: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${COLORS.textSubtle}; font-size: 12px;">
                      © ${new Date().getFullYear()} LegacyPay. Todos os direitos reservados.
                    </p>
                    <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 11px;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Texto fora do card -->
        <p style="margin: 24px 0 0 0; color: ${COLORS.textSubtle}; font-size: 11px; text-align: center;">
          Enviado com 🧡 pela equipe LegacyPay
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${config.icon} ${config.title} - LegacyPay`,
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Erro ao enviar notificação de saque:", error);
      return false;
    }

    console.log("[Email] Notificação de saque enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificação de saque:", error);
    return false;
  }
}

export async function sendDepositNotification(
  to: string,
  name: string,
  amount: number
): Promise<boolean> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, ${COLORS.cardBg} 0%, #0d0d0d 100%); border-radius: 24px; border: 1px solid ${COLORS.cardBorder}; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(255, 107, 0, 0.15);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; text-align: center; background: linear-gradient(180deg, rgba(255, 107, 0, 0.08) 0%, transparent 100%);">
              <img src="${LOGO_URL}" alt="LegacyPay" width="80" height="80" style="display: block; margin: 0 auto 24px auto; border-radius: 16px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: ${COLORS.primary};">Legacy</span><span style="color: ${COLORS.text};">Pay</span>
              </h1>
              <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px;">Sua plataforma de pagamentos</p>
            </td>
          </tr>

          <!-- Divisor gradiente -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 2px; background: linear-gradient(90deg, transparent, ${COLORS.primary}, transparent); border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Conteudo -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 28px;">
                <div style="display: inline-block; font-size: 48px; margin-bottom: 16px;">
                  💰
                </div>
                <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 22px; font-weight: 600;">
                  Depósito Recebido!
                </h2>
              </div>
              
              <p style="margin: 0 0 24px 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.7; text-align: center;">
                Olá <strong style="color: ${COLORS.text};">${name}</strong>,
              </p>
              
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #141414 100%); border: 2px solid #22c55e; border-radius: 20px; padding: 28px; text-align: center; margin-bottom: 28px;">
                <p style="margin: 0 0 8px 0; color: ${COLORS.textSubtle}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Valor creditado</p>
                <span style="font-size: 36px; font-weight: 700; color: #22c55e;">R$ ${amount.toFixed(2)}</span>
              </div>
              
              <p style="margin: 0 0 28px 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.7; text-align: center;">
                O valor já está disponível na sua conta para utilização.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="https://legacypay.shop/dashboard/wallet" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);">
                  Ver meu saldo →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%); border-top: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${COLORS.textSubtle}; font-size: 12px;">
                      © ${new Date().getFullYear()} LegacyPay. Todos os direitos reservados.
                    </p>
                    <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 11px;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Texto fora do card -->
        <p style="margin: 24px 0 0 0; color: ${COLORS.textSubtle}; font-size: 11px; text-align: center;">
          Enviado com 🧡 pela equipe LegacyPay
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `💰 Depósito de R$ ${amount.toFixed(2)} recebido - LegacyPay`,
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Erro ao enviar notificação de depósito:", error);
      return false;
    }

    console.log("[Email] Notificação de depósito enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificação de depósito:", error);
    return false;
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  title: string,
  message: string
): Promise<boolean> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, ${COLORS.cardBg} 0%, #0d0d0d 100%); border-radius: 24px; border: 1px solid ${COLORS.cardBorder}; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(255, 107, 0, 0.15);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; text-align: center; background: linear-gradient(180deg, rgba(255, 107, 0, 0.08) 0%, transparent 100%);">
              <img src="${LOGO_URL}" alt="LegacyPay" width="80" height="80" style="display: block; margin: 0 auto 24px auto; border-radius: 16px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: ${COLORS.primary};">Legacy</span><span style="color: ${COLORS.text};">Pay</span>
              </h1>
              <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px;">Sua plataforma de pagamentos</p>
            </td>
          </tr>

          <!-- Divisor gradiente -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 2px; background: linear-gradient(90deg, transparent, ${COLORS.primary}, transparent); border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Conteudo -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; color: ${COLORS.text}; font-size: 22px; font-weight: 600; text-align: center;">
                ${title}
              </h2>
              
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #141414 100%); border-radius: 16px; padding: 24px; margin-bottom: 28px;">
                <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.7;">
                  ${message}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="https://legacypay.shop/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);">
                  Acessar minha conta →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%); border-top: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${COLORS.textSubtle}; font-size: 12px;">
                      © ${new Date().getFullYear()} LegacyPay. Todos os direitos reservados.
                    </p>
                    <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 11px;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Texto fora do card -->
        <p style="margin: 24px 0 0 0; color: ${COLORS.textSubtle}; font-size: 11px; text-align: center;">
          Enviado com 🧡 pela equipe LegacyPay
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Erro ao enviar notificação:", error);
      return false;
    }

    console.log("[Email] Notificação enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificação:", error);
    return false;
  }
}

// Função para enviar email de reset de senha
export async function sendPasswordResetEmail(
  to: string,
  code: string,
  name?: string
): Promise<boolean> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, ${COLORS.cardBg} 0%, #0d0d0d 100%); border-radius: 24px; border: 1px solid ${COLORS.cardBorder}; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(255, 107, 0, 0.15);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; text-align: center; background: linear-gradient(180deg, rgba(255, 107, 0, 0.08) 0%, transparent 100%);">
              <img src="${LOGO_URL}" alt="LegacyPay" width="80" height="80" style="display: block; margin: 0 auto 24px auto; border-radius: 16px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: ${COLORS.primary};">Legacy</span><span style="color: ${COLORS.text};">Pay</span>
              </h1>
              <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px;">Alteração de Senha</p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 24px 0; color: ${COLORS.text}; font-size: 16px; line-height: 1.6;">
                Olá${name ? `, <strong>${name}</strong>` : ""}! 👋
              </p>
              
              <p style="margin: 0 0 24px 0; color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.6;">
                Você solicitou a alteração da sua senha. Use o código abaixo para continuar:
              </p>
              
              <!-- Código de verificação -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background: linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(255, 140, 0, 0.1) 100%); border: 2px solid ${COLORS.primary}; border-radius: 16px; padding: 32px; text-align: center;">
                    <p style="margin: 0 0 12px 0; color: ${COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                      Código de Segurança
                    </p>
                    <p style="margin: 0; font-size: 42px; font-weight: 700; letter-spacing: 12px; color: ${COLORS.primary}; font-family: 'Courier New', monospace; text-shadow: 0 0 30px rgba(255, 107, 0, 0.3);">
                      ${code}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Aviso -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px;">
                    <p style="margin: 0; color: #fca5a5; font-size: 13px; line-height: 1.5;">
                      ⚠️ <strong>Importante:</strong> Se você não solicitou esta alteração, ignore este email e sua conta permanecerá segura.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 12px;">
                Este código expira em <strong style="color: ${COLORS.text};">10 minutos</strong>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid ${COLORS.cardBorder}; text-align: center;">
              <p style="margin: 0 0 8px 0; color: ${COLORS.textMuted}; font-size: 12px;">
                © ${new Date().getFullYear()} LegacyPay. Todos os direitos reservados.
              </p>
              <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 11px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Texto fora do card -->
        <p style="margin: 24px 0 0 0; color: ${COLORS.textSubtle}; font-size: 11px; text-align: center;">
          Enviado com 🧡 pela equipe LegacyPay
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🔐 Alteração de Senha - LegacyPay",
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Erro ao enviar email de reset de senha:", error);
      return false;
    }

    console.log("[Email] Email de reset de senha enviado para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email de reset de senha:", error);
    return false;
  }
}

export async function sendNewLoginAlert(
  to: string,
  name: string,
  device: string,
  browser: string,
  ip: string,
  date: string
): Promise<boolean> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, ${COLORS.cardBg} 0%, #0d0d0d 100%); border-radius: 24px; border: 1px solid ${COLORS.cardBorder}; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(255, 107, 0, 0.15);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; text-align: center; background: linear-gradient(180deg, rgba(255, 107, 0, 0.08) 0%, transparent 100%);">
              <img src="${LOGO_URL}" alt="LegacyPay" width="80" height="80" style="display: block; margin: 0 auto 24px auto; border-radius: 16px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: ${COLORS.primary};">Legacy</span><span style="color: ${COLORS.text};">Pay</span>
              </h1>
            </td>
          </tr>

          <!-- Divisor -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 2px; background: linear-gradient(90deg, transparent, ${COLORS.primary}, transparent); border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Conteudo -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 28px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
                <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 22px; font-weight: 600;">
                  Novo acesso detectado
                </h2>
              </div>
              
              <p style="margin: 0 0 24px 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.7; text-align: center;">
                Ola <strong style="color: ${COLORS.text};">${name}</strong>, detectamos um login na sua conta de um novo dispositivo.
              </p>
              
              <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: ${COLORS.textMuted}; font-size: 14px;">Dispositivo:</td>
                    <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 14px; text-align: right;">${device}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: ${COLORS.textMuted}; font-size: 14px;">Navegador:</td>
                    <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 14px; text-align: right;">${browser}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: ${COLORS.textMuted}; font-size: 14px;">IP:</td>
                    <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 14px; text-align: right;">${ip}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: ${COLORS.textMuted}; font-size: 14px;">Data:</td>
                    <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 14px; text-align: right;">${date}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 13px; line-height: 1.6; text-align: center;">
                Se nao foi voce, altere sua senha imediatamente e entre em contato com o suporte.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%); border-top: 1px solid ${COLORS.cardBorder};">
              <p style="margin: 0; color: ${COLORS.textSubtle}; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} LegacyPay. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Novo acesso na sua conta - LegacyPay",
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Erro ao enviar alerta de login:", error);
      return false;
    }

    console.log("[Email] Alerta de login enviado para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar alerta de login:", error);
    return false;
  }
}
