import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "re_d6rdAK4W_3ZhUjLBsyzMvL88AKJjwX9JF");
  }
  return _resend;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o email existe na tabela profiles
    const users = await sql`
      SELECT id, email, name FROM profiles WHERE email = ${email}
    `;

    if (users.length === 0) {
      // Por segurança, não informamos se o email existe ou não
      return NextResponse.json({
        success: true,
        message: "Se o email estiver cadastrado, você receberá um código de recuperação.",
      });
    }

    const user = users[0];

    // Invalidar tokens anteriores
    await sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE email = ${email} AND used = false
    `;

    // Gerar novo código
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Salvar token no banco
    await sql`
      INSERT INTO password_reset_tokens (email, code, expires_at)
      VALUES (${email}, ${code}, ${expiresAt.toISOString()})
    `;

    // Enviar email
    try {
      await getResend().emails.send({
        from: process.env.EMAIL_FROM || "LuckyPay <noreply@luckypay.com.br>",
        to: email,
        subject: "Código de Recuperação de Senha - LuckyPay",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111111; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">LuckyPay</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 32px;">
                        <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                          Recuperação de Senha
                        </h2>
                        <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                          Olá${user.name ? `, ${user.name}` : ''}! Recebemos uma solicitação para redefinir sua senha.
                        </p>
                        <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                          Use o código abaixo para redefinir sua senha:
                        </p>
                        
                        <!-- Code Box -->
                        <div style="background-color: #1a1a1a; border: 2px solid #f97316; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                          <span style="font-size: 36px; font-weight: bold; color: #f97316; letter-spacing: 8px;">${code}</span>
                        </div>
                        
                        <p style="margin: 24px 0 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                          Este código expira em <strong style="color: #f97316;">15 minutos</strong>.
                        </p>
                        <p style="margin: 16px 0 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                          Se você não solicitou a redefinição de senha, ignore este email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center;">
                        <p style="margin: 0; color: #52525b; font-size: 12px;">
                          © ${new Date().getFullYear()} LuckyPay. Todos os direitos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("[v0] Error sending email:", emailError);
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código de recuperação enviado para o seu email.",
    });
  } catch (error) {
    console.error("[v0] Error in forgot password:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
