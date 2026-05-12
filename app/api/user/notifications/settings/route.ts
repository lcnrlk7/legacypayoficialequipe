import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const result = await sql`
      SELECT 
        notifications_push,
        notifications_email,
        notifications_email_frequency,
        push_subscription
      FROM profiles 
      WHERE id = ${session.userId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      notifications_push: result[0].notifications_push || false,
      notifications_email: result[0].notifications_email || false,
      notifications_email_frequency: result[0].notifications_email_frequency || "daily",
      has_push_subscription: !!result[0].push_subscription,
    });
  } catch (error) {
    console.error("Erro ao buscar configuracoes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      notifications_push, 
      notifications_email, 
      notifications_email_frequency,
      push_subscription 
    } = body;

    // Build dynamic update
    if (push_subscription !== undefined) {
      await sql`
        UPDATE profiles 
        SET 
          notifications_push = COALESCE(${notifications_push}, notifications_push),
          notifications_email = COALESCE(${notifications_email}, notifications_email),
          notifications_email_frequency = COALESCE(${notifications_email_frequency}, notifications_email_frequency),
          push_subscription = ${push_subscription ? JSON.stringify(push_subscription) : null}::jsonb,
          updated_at = NOW()
        WHERE id = ${session.userId}
      `;
    } else {
      await sql`
        UPDATE profiles 
        SET 
          notifications_push = COALESCE(${notifications_push}, notifications_push),
          notifications_email = COALESCE(${notifications_email}, notifications_email),
          notifications_email_frequency = COALESCE(${notifications_email_frequency}, notifications_email_frequency),
          updated_at = NOW()
        WHERE id = ${session.userId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar configuracoes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
