import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET - Obter ticket com mensagens (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Verificar se e admin
    const admin = await sql`
      SELECT role, name, avatar_url FROM profiles WHERE id = ${session.userId}
    `;
    if (admin.length === 0 || !['admin', 'ceo'].includes(admin[0].role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;

    // Buscar ticket
    const ticket = await sql`
      SELECT 
        t.*,
        p.name as user_name,
        p.email as user_email,
        p.phone as user_phone,
        p.avatar_url as user_avatar,
        p.created_at as user_since,
        a.name as admin_name,
        a.avatar_url as admin_avatar
      FROM support_tickets t
      LEFT JOIN profiles p ON t.user_id = p.id
      LEFT JOIN profiles a ON t.assigned_admin_id = a.id
      WHERE t.id = ${id}
    `;

    if (ticket.length === 0) {
      return NextResponse.json({ error: "Ticket nao encontrado" }, { status: 404 });
    }

    // Buscar mensagens
    const messages = await sql`
      SELECT 
        m.*,
        p.name as sender_name,
        p.avatar_url as sender_avatar,
        p.role as sender_role
      FROM ticket_messages m
      LEFT JOIN profiles p ON m.sender_id = p.id
      WHERE m.ticket_id = ${id}
      ORDER BY m.created_at ASC
    `;

    // Marcar mensagens do usuario como lidas
    await sql`
      UPDATE ticket_messages 
      SET is_read = true 
      WHERE ticket_id = ${id} AND sender_type = 'user' AND is_read = false
    `;

    // Lista de admins
    const admins = await sql`
      SELECT id, name, email, avatar_url FROM profiles WHERE role IN ('admin', 'ceo') ORDER BY name
    `;

    return NextResponse.json({ 
      ticket: ticket[0], 
      messages, 
      admins,
      currentAdmin: admin[0]
    });
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Enviar resposta (admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Verificar se e admin
    const admin = await sql`
      SELECT role, name, avatar_url FROM profiles WHERE id = ${session.userId}
    `;
    if (admin.length === 0 || !['admin', 'ceo'].includes(admin[0].role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message, attachmentUrl, attachmentType } = body;

    if (!message && !attachmentUrl) {
      return NextResponse.json({ error: "Mensagem ou anexo obrigatorio" }, { status: 400 });
    }

    // Verificar se ticket existe
    const ticket = await sql`SELECT * FROM support_tickets WHERE id = ${id}`;
    if (ticket.length === 0) {
      return NextResponse.json({ error: "Ticket nao encontrado" }, { status: 404 });
    }

    // Auto-atribuir se nao tiver admin
    if (!ticket[0].assigned_admin_id) {
      await sql`
        UPDATE support_tickets 
        SET assigned_admin_id = ${session.userId}, status = 'in_progress', updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    // Criar mensagem
    const newMessage = await sql`
      INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, attachment_url, attachment_type)
      VALUES (${id}, ${session.userId}, 'admin', ${message || ''}, ${attachmentUrl || null}, ${attachmentType || null})
      RETURNING *
    `;

    // Atualizar last_message_at
    await sql`
      UPDATE support_tickets SET last_message_at = NOW(), updated_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true, 
      message: { 
        ...newMessage[0], 
        sender_name: admin[0].name,
        sender_avatar: admin[0].avatar_url,
        sender_role: admin[0].role
      } 
    });
  } catch (error) {
    console.error("Erro ao enviar resposta:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH - Atualizar ticket (status, prioridade, atribuicao)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Verificar se e admin
    const admin = await sql`
      SELECT role FROM profiles WHERE id = ${session.userId}
    `;
    if (admin.length === 0 || !['admin', 'ceo'].includes(admin[0].role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority, assignedAdminId } = body;

    const updates: string[] = [];
    
    if (status) {
      updates.push(`status = '${status}'`);
      if (status === 'closed') {
        updates.push(`closed_at = NOW()`);
      } else {
        updates.push(`closed_at = NULL`);
      }
    }
    if (priority) {
      updates.push(`priority = '${priority}'`);
    }
    if (assignedAdminId !== undefined) {
      if (assignedAdminId === null) {
        updates.push(`assigned_admin_id = NULL`);
      } else {
        updates.push(`assigned_admin_id = '${assignedAdminId}'`);
      }
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      await sql.unsafe(`UPDATE support_tickets SET ${updates.join(', ')} WHERE id = '${id}'`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar ticket:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
