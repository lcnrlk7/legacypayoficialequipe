import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";

function generateClientId(): string {
  return `lp_${crypto.randomBytes(16).toString("hex")}`;
}

function generateClientSecret(): string {
  return `sk_${crypto.randomBytes(32).toString("hex")}`;
}

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = await sql`
      SELECT api_key, api_secret, webhook_url, webhook_secret, api_enabled, daily_limit, fee_percentage
      FROM profiles
      WHERE id = ${user.id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const profile = result[0];

    return NextResponse.json({
      success: true,
      data: {
        client_id: profile.api_key,
        client_secret: profile.api_secret ? "••••••••" + profile.api_secret.slice(-8) : null,
        webhook_url: profile.webhook_url,
        webhook_secret: profile.webhook_secret ? "••••••••" + profile.webhook_secret.slice(-8) : null,
        api_enabled: profile.api_enabled,
        daily_limit: profile.daily_limit,
        fee_percentage: profile.fee_percentage,
        has_credentials: !!profile.api_key && !!profile.api_secret,
      },
    });
  } catch (error) {
    console.error("[v0] Error getting credentials:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar KYC
    if (user.kyc_status !== "approved") {
      return NextResponse.json(
        { error: "KYC precisa estar aprovado para gerar credenciais" },
        { status: 403 }
      );
    }

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const webhookSecret = generateWebhookSecret();

    await sql`
      UPDATE profiles
      SET 
        api_key = ${clientId},
        api_secret = ${clientSecret},
        webhook_secret = ${webhookSecret},
        api_enabled = true,
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      message: "Credenciais geradas com sucesso. Guarde-as em local seguro.",
      data: {
        client_id: clientId,
        client_secret: clientSecret,
        webhook_secret: webhookSecret,
      },
    });
  } catch (error) {
    console.error("[v0] Error generating credentials:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { webhook_url } = body;

    await sql`
      UPDATE profiles
      SET webhook_url = ${webhook_url}, updated_at = NOW()
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      message: "Webhook URL atualizada com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error updating webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
