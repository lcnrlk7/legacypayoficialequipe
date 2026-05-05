import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET - Listar tickets do usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let tickets;
    if (status && status !== "all") {
      tickets = await sql`
        SELECT 
          t.*,
          p.name as user_name,
          p.email as user_email,
          a.name as admin_name,
          (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id AND is_read = false AND sender_type = 'admin') as unread_count
        FROM support_tickets t
        LEFT JOIN profiles p ON t.user_id = p.id
        LEFT JOIN profiles a ON t.assigned_admin_id = a.id
        WHERE t.user_id = ${session.userId} AND t.status = ${status}
        ORDER BY t.last_message_at DESC
      `;
    } else {
      tickets = await sql`
        SELECT 
          t.*,
          p.name as user_name,
          p.email as user_email,
          a.name as admin_name,
          (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id AND is_read = false AND sender_type = 'admin') as unread_count
        FROM support_tickets t
        LEFT JOIN profiles p ON t.user_id = p.id
        LEFT JOIN profiles a ON t.assigned_admin_id = a.id
        WHERE t.user_id = ${session.userId}
        ORDER BY t.last_message_at DESC
      `;
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar novo ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, priority, message, attachmentUrl, attachmentType } = body;

    if (!subject || !category || !message) {
      return NextResponse.json({ error: "Campos obrigatorios faltando" }, { status: 400 });
    }

    // Criar ticket
    const ticket = await sql`
      INSERT INTO support_tickets (user_id, subject, category, priority)
      VALUES (${session.userId}, ${subject}, ${category}, ${priority || 'normal'})
      RETURNING *
    `;

    // Criar primeira mensagem
    await sql`
      INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, attachment_url, attachment_type)
      VALUES (${ticket[0].id}, ${session.userId}, 'user', ${message}, ${attachmentUrl || null}, ${attachmentType || null})
    `;

    return NextResponse.json({ success: true, ticket: ticket[0] });
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
