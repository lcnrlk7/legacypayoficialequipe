import { Resend } from "resend";

// Funcao para obter a instancia do Resend
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY || "";
  return new Resend(apiKey);
}

// Email oficial com dominio verificado
const FROM_EMAIL = "Hyperion Pay <noreply@hyperionpayments.online>";

// Logo da Hyperion Pay (mascote) - hospedado publicamente
const LOGO_URL = "https://hyperionpay.com.br/mascote.png";

// Cores da marca - Indigo escuro premium
const COLORS = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  primaryDeep: "#3730a3",
  accent: "#818cf8",
  background: "#050510",
  cardBg: "#0c0c1d",
  cardBorder: "#1e1b4b",
  innerBg: "#12122b",
  text: "#ffffff",
  textMuted: "#c7d2fe",
  textSubtle: "#6366f1",
  footerText: "#4338ca",
};

// Template base do email
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px;">
          
          <!-- Header flutuante -->
          <tr>
            <td style="padding: 0 0 24px 0; text-align: center;">
              <img src="${LOGO_URL}" alt="Hyperion Pay" width="72" height="72" style="display: block; margin: 0 auto 16px auto; border-radius: 18px; border: 2px solid ${COLORS.cardBorder};">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: ${COLORS.primary};">HYPERION</span><span style="color: ${COLORS.text};"> PAY</span>
              </h1>
            </td>
          </tr>
          
          <!-- Card principal -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: ${COLORS.cardBg}; border-radius: 20px; border: 1px solid ${COLORS.cardBorder}; overflow: hidden;">
                
                <!-- Barra superior indigo -->
                <tr>
                  <td style="height: 3px; background: linear-gradient(90deg, ${COLORS.primaryDeep}, ${COLORS.primary}, ${COLORS.accent}, ${COLORS.primary}, ${COLORS.primaryDeep});"></td>
                </tr>
                
                <!-- Conteudo -->
                ${content}
                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 0 0 0; text-align: center;">
              <p style="margin: 0 0 4px 0; color: ${COLORS.footerText}; font-size: 11px;">
                Hyperion Pay - Construindo legado. Gerando liberdade.
              </p>
              <p style="margin: 0; color: ${COLORS.primaryDeep}; font-size: 10px;">
                Este e um email automatico. Por favor, nao responda.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  name?: string
): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px 36px 16px 36px; text-align: center;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background: ${COLORS.innerBg}; border: 1px solid ${COLORS.cardBorder}; border-radius: 14px; font-size: 24px; margin-bottom: 20px;">&#128272;</div>
        <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 20px; font-weight: 700;">
          Verificacao de Email
        </h2>
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.6;">
          ${name ? `Ola <strong style="color: ${COLORS.text};">${name}</strong>, ` : ""}use o codigo abaixo para verificar sua conta.
        </p>
      </td>
    </tr>
    
    <!-- Codigo OTP -->
    <tr>
      <td style="padding: 16px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: ${COLORS.innerBg}; border: 2px solid ${COLORS.primary}; border-radius: 16px; padding: 28px 20px; text-align: center;">
              <p style="margin: 0 0 12px 0; color: ${COLORS.accent}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px;">Seu codigo</p>
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="font-family: 'Courier New', Courier, monospace; font-size: 44px; font-weight: 700; color: ${COLORS.text}; letter-spacing: 14px; padding: 8px 16px; background: ${COLORS.background}; border-radius: 12px; border: 1px solid ${COLORS.cardBorder};">${code}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Info -->
    <tr>
      <td style="padding: 16px 36px 36px 36px; text-align: center;">
        <p style="margin: 0 0 8px 0; color: ${COLORS.textMuted}; font-size: 13px;">
          Este codigo expira em <strong style="color: ${COLORS.text};">10 minutos</strong>
        </p>
        <p style="margin: 0; color: ${COLORS.primaryDeep}; font-size: 12px;">
          Se voce nao solicitou este codigo, pode ignorar este email.
        </p>
      </td>
    </tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${code} - Codigo de Verificacao | Hyperion Pay`,
      html: emailWrapper(content),
    });

    if (error) {
      console.error("[Email] Erro ao enviar:", error);
      return false;
    }

    console.log("[Email] Codigo enviado com sucesso para:", to);
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
  const content = `
    <tr>
      <td style="padding: 40px 36px 16px 36px; text-align: center;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background: linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary}); border-radius: 50%; font-size: 24px; margin-bottom: 20px; color: white;">&#10003;</div>
        <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 22px; font-weight: 700;">
          Bem-vindo, ${name}!
        </h2>
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px;">
          Sua conta foi criada com sucesso
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 16px 36px;">
        <p style="margin: 0 0 20px 0; color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.7; text-align: center;">
          Agora voce faz parte da Hyperion Pay! Confira o que voce pode fazer:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: ${COLORS.innerBg}; border-radius: 14px; border: 1px solid ${COLORS.cardBorder};">
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="32" style="color: ${COLORS.accent}; font-size: 16px;">&#9889;</td>
                <td style="color: ${COLORS.text}; font-size: 13px;">Receber pagamentos via PIX instantaneo</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="32" style="color: ${COLORS.accent}; font-size: 16px;">&#128202;</td>
                <td style="color: ${COLORS.text}; font-size: 13px;">Acompanhar todas as suas transacoes</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="32" style="color: ${COLORS.accent}; font-size: 16px;">&#128176;</td>
                <td style="color: ${COLORS.text}; font-size: 13px;">Sacar para sua conta bancaria</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="32" style="color: ${COLORS.accent}; font-size: 16px;">&#128274;</td>
                <td style="color: ${COLORS.text}; font-size: 13px;">Seguranca e protecao em todas as operacoes</td>
              </tr></table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 24px 36px 36px 36px; text-align: center;">
        <a href="https://app.hyperionpay.com.br/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 36px; border-radius: 10px; letter-spacing: 0.3px;">
          Acessar minha conta &#8594;
        </a>
      </td>
    </tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Bem-vindo a Hyperion Pay!",
      html: emailWrapper(content),
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
      icon: "&#9203;",
      title: "Saque Solicitado",
      message: `Seu saque de <strong style="color: ${COLORS.text};">R$ ${amount.toFixed(2)}</strong> foi recebido e esta em analise.`,
      color: "#eab308",
      bg: "rgba(234, 179, 8, 0.08)",
      border: "rgba(234, 179, 8, 0.3)",
    },
    approved: {
      icon: "&#9989;",
      title: "Saque Aprovado",
      message: `Seu saque de <strong style="color: ${COLORS.text};">R$ ${amount.toFixed(2)}</strong> foi aprovado e sera processado em breve.`,
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.08)",
      border: "rgba(34, 197, 94, 0.3)",
    },
    rejected: {
      icon: "&#10060;",
      title: "Saque Recusado",
      message: `Seu saque de <strong style="color: ${COLORS.text};">R$ ${amount.toFixed(2)}</strong> nao pode ser processado. Entre em contato com o suporte.`,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.08)",
      border: "rgba(239, 68, 68, 0.3)",
    },
    completed: {
      icon: "&#128184;",
      title: "Saque Concluido",
      message: `Seu saque de <strong style="color: ${COLORS.text};">R$ ${amount.toFixed(2)}</strong> foi enviado para sua conta PIX com sucesso!`,
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.08)",
      border: "rgba(34, 197, 94, 0.3)",
    },
  };

  const config = statusConfig[status];

  const content = `
    <tr>
      <td style="padding: 40px 36px 16px 36px; text-align: center;">
        <div style="display: inline-block; font-size: 40px; margin-bottom: 16px;">${config.icon}</div>
        <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 20px; font-weight: 700;">
          ${config.title}
        </h2>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 8px 36px 16px 36px; text-align: center;">
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px;">
          Ola <strong style="color: ${COLORS.text};">${name}</strong>,
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 8px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: ${config.bg}; border-left: 4px solid ${config.color}; border-radius: 12px; padding: 20px;">
              <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.7;">
                ${config.message}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 24px 36px 36px 36px; text-align: center;">
        <a href="https://app.hyperionpay.com.br/dashboard/wallet" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 36px; border-radius: 10px;">
          Ver detalhes &#8594;
        </a>
      </td>
    </tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${config.title} - Hyperion Pay`,
      html: emailWrapper(content),
    });

    if (error) {
      console.error("[Email] Erro ao enviar notificacao de saque:", error);
      return false;
    }

    console.log("[Email] Notificacao de saque enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificacao de saque:", error);
    return false;
  }
}

export async function sendDepositNotification(
  to: string,
  name: string,
  amount: number
): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px 36px 16px 36px; text-align: center;">
        <div style="display: inline-block; font-size: 40px; margin-bottom: 16px;">&#128176;</div>
        <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 20px; font-weight: 700;">
          Deposito Recebido!
        </h2>
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px;">
          Ola <strong style="color: ${COLORS.text};">${name}</strong>,
        </p>
      </td>
    </tr>
    
    <!-- Valor -->
    <tr>
      <td style="padding: 16px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: ${COLORS.innerBg}; border: 2px solid #22c55e; border-radius: 16px; padding: 28px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: ${COLORS.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Valor creditado</p>
              <span style="font-size: 36px; font-weight: 700; color: #22c55e;">R$ ${amount.toFixed(2)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 8px 36px; text-align: center;">
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px;">
          O valor ja esta disponivel na sua conta.
        </p>
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 24px 36px 36px 36px; text-align: center;">
        <a href="https://app.hyperionpay.com.br/dashboard/wallet" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 36px; border-radius: 10px;">
          Ver meu saldo &#8594;
        </a>
      </td>
    </tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Deposito de R$ ${amount.toFixed(2)} recebido - Hyperion Pay`,
      html: emailWrapper(content),
    });

    if (error) {
      console.error("[Email] Erro ao enviar notificacao de deposito:", error);
      return false;
    }

    console.log("[Email] Notificacao de deposito enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificacao de deposito:", error);
    return false;
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  title: string,
  message: string
): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px 36px 16px 36px; text-align: center;">
        <h2 style="margin: 0 0 16px 0; color: ${COLORS.text}; font-size: 20px; font-weight: 700;">
          ${title}
        </h2>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 0 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: ${COLORS.innerBg}; border-radius: 14px; border: 1px solid ${COLORS.cardBorder}; padding: 24px;">
              <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.7;">
                ${message}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 28px 36px 36px 36px; text-align: center;">
        <a href="https://app.hyperionpay.com.br/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 36px; border-radius: 10px;">
          Acessar minha conta &#8594;
        </a>
      </td>
    </tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: emailWrapper(content),
    });

    if (error) {
      console.error("[Email] Erro ao enviar notificacao:", error);
      return false;
    }

    console.log("[Email] Notificacao enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificacao:", error);
    return false;
  }
}

// Funcao para enviar email de reset de senha
export async function sendPasswordResetEmail(
  to: string,
  code: string,
  name?: string
): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px 36px 16px 36px; text-align: center;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background: ${COLORS.innerBg}; border: 1px solid ${COLORS.cardBorder}; border-radius: 14px; font-size: 24px; margin-bottom: 20px;">&#128274;</div>
        <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 20px; font-weight: 700;">
          Alteracao de Senha
        </h2>
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.6;">
          ${name ? `Ola <strong style="color: ${COLORS.text};">${name}</strong>, ` : ""}voce solicitou a alteracao da sua senha.
        </p>
      </td>
    </tr>
    
    <!-- Codigo -->
    <tr>
      <td style="padding: 16px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: ${COLORS.innerBg}; border: 2px solid ${COLORS.primary}; border-radius: 16px; padding: 28px 20px; text-align: center;">
              <p style="margin: 0 0 12px 0; color: ${COLORS.accent}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px;">Codigo de seguranca</p>
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="font-family: 'Courier New', Courier, monospace; font-size: 44px; font-weight: 700; color: ${COLORS.text}; letter-spacing: 14px; padding: 8px 16px; background: ${COLORS.background}; border-radius: 12px; border: 1px solid ${COLORS.cardBorder};">${code}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Aviso -->
    <tr>
      <td style="padding: 16px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 14px 16px;">
              <p style="margin: 0; color: #fca5a5; font-size: 12px; line-height: 1.5;">
                <strong>Importante:</strong> Se voce nao solicitou esta alteracao, ignore este email e sua conta permanecera segura.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 12px 36px 36px 36px; text-align: center;">
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 13px;">
          Este codigo expira em <strong style="color: ${COLORS.text};">10 minutos</strong>.
        </p>
      </td>
    </tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Alteracao de Senha - Hyperion Pay",
      html: emailWrapper(content),
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
  const content = `
    <tr>
      <td style="padding: 40px 36px 16px 36px; text-align: center;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 14px; font-size: 24px; margin-bottom: 20px;">&#128275;</div>
        <h2 style="margin: 0 0 8px 0; color: ${COLORS.text}; font-size: 20px; font-weight: 700;">
          Novo acesso detectado
        </h2>
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px;">
          Ola <strong style="color: ${COLORS.text};">${name}</strong>, detectamos um login na sua conta.
        </p>
      </td>
    </tr>
    
    <!-- Detalhes -->
    <tr>
      <td style="padding: 16px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: ${COLORS.innerBg}; border-radius: 14px; border: 1px solid ${COLORS.cardBorder};">
          <tr>
            <td style="padding: 14px 20px; border-bottom: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="color: ${COLORS.textMuted}; font-size: 13px;">Dispositivo</td>
                <td style="color: ${COLORS.text}; font-size: 13px; text-align: right; font-weight: 600;">${device}</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 20px; border-bottom: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="color: ${COLORS.textMuted}; font-size: 13px;">Navegador</td>
                <td style="color: ${COLORS.text}; font-size: 13px; text-align: right; font-weight: 600;">${browser}</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 20px; border-bottom: 1px solid ${COLORS.cardBorder};">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="color: ${COLORS.textMuted}; font-size: 13px;">IP</td>
                <td style="color: ${COLORS.text}; font-size: 13px; text-align: right; font-family: 'Courier New', monospace;">${ip}</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="color: ${COLORS.textMuted}; font-size: 13px;">Data</td>
                <td style="color: ${COLORS.text}; font-size: 13px; text-align: right; font-weight: 600;">${date}</td>
              </tr></table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 16px 36px 36px 36px; text-align: center;">
        <p style="margin: 0; color: ${COLORS.primaryDeep}; font-size: 12px; line-height: 1.6;">
          Se nao foi voce, altere sua senha imediatamente e entre em contato com o suporte.
        </p>
      </td>
    </tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Novo acesso na sua conta - Hyperion Pay",
      html: emailWrapper(content),
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
