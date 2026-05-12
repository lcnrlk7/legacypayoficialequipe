import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET - Obter preferencias de email
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    let preferences = await sql`
      SELECT * FROM email_preferences WHERE user_id = ${session.userId}
    `;

    // Criar preferencias padrao se nao existir
    if (preferences.length === 0) {
      await sql`
        INSERT INTO email_preferences (user_id) VALUES (${session.userId})
      `;
      preferences = await sql`
        SELECT * FROM email_preferences WHERE user_id = ${session.userId}
      `;
    }

    return NextResponse.json({ preferences: preferences[0] });
  } catch (error) {
    console.error("Erro ao buscar preferencias:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT - Atualizar preferencias de email
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      payment_received,
      withdrawal_approved,
      withdrawal_rejected,
      ticket_response,
      login_alert,
      marketing,
    } = body;

    await sql`
      INSERT INTO email_preferences (
        user_id, 
        payment_received, 
        withdrawal_approved, 
        withdrawal_rejected, 
        ticket_response, 
        login_alert, 
        marketing
      )
      VALUES (
        ${session.userId}, 
        ${payment_received ?? true}, 
        ${withdrawal_approved ?? true}, 
        ${withdrawal_rejected ?? true}, 
        ${ticket_response ?? true}, 
        ${login_alert ?? true}, 
        ${marketing ?? false}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        payment_received = ${payment_received ?? true},
        withdrawal_approved = ${withdrawal_approved ?? true},
        withdrawal_rejected = ${withdrawal_rejected ?? true},
        ticket_response = ${ticket_response ?? true},
        login_alert = ${login_alert ?? true},
        marketing = ${marketing ?? false},
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar preferencias:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
