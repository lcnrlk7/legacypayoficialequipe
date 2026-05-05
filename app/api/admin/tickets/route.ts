import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET - Listar todos os tickets (admin)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const assignedTo = searchParams.get("assignedTo");

    let query = `
      SELECT 
        t.*,
        p.name as user_name,
        p.email as user_email,
        p.avatar_url as user_avatar,
        a.name as admin_name,
        (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id AND is_read = false AND sender_type = 'user') as unread_count
      FROM support_tickets t
      LEFT JOIN profiles p ON t.user_id = p.id
      LEFT JOIN profiles a ON t.assigned_admin_id = a.id
      WHERE 1=1
    `;

    const conditions: string[] = [];
    
    if (status && status !== "all") {
      conditions.push(`t.status = '${status}'`);
    }
    if (category && category !== "all") {
      conditions.push(`t.category = '${category}'`);
    }
    if (assignedTo === "me") {
      conditions.push(`t.assigned_admin_id = '${session.userId}'`);
    } else if (assignedTo === "unassigned") {
      conditions.push(`t.assigned_admin_id IS NULL`);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY 
      CASE WHEN t.status = 'open' THEN 0 
           WHEN t.status = 'in_progress' THEN 1 
           ELSE 2 END,
      CASE WHEN t.priority = 'urgent' THEN 0 
           WHEN t.priority = 'high' THEN 1 
           WHEN t.priority = 'normal' THEN 2 
           ELSE 3 END,
      t.last_message_at DESC`;

    const tickets = await sql.unsafe(query);

    // Stats
    const stats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'open') as open_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
        COUNT(*) FILTER (WHERE assigned_admin_id IS NULL AND status != 'closed') as unassigned_count
      FROM support_tickets
    `;

    // Lista de admins para atribuicao
    const admins = await sql`
      SELECT id, name, email, avatar_url FROM profiles WHERE role IN ('admin', 'ceo') ORDER BY name
    `;

    return NextResponse.json({ 
      tickets, 
      stats: stats[0],
      admins 
    });
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
