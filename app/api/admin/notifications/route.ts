import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const notifications = await sql`
      SELECT un.*, p.name, p.email
      FROM user_notifications un
      LEFT JOIN profiles p ON p.id = un.user_id
      ORDER BY un.created_at DESC
      LIMIT 100
    `;

    // Transform to match expected format
    const transformed = notifications.map((n: Record<string, unknown>) => ({
      ...n,
      profiles: n.name || n.email ? { name: n.name, email: n.email } : null,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    const body = await request.json();
    const { user_id, title, message, type, is_global } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Título e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    if (is_global) {
      // Busca todos os usuários ativos
      const users = await sql`SELECT id FROM profiles WHERE is_active = true`;

      // Cria notificação para cada usuário
      for (const user of users) {
        await sql`
          INSERT INTO user_notifications (user_id, title, message, type)
          VALUES (${user.id}, ${title}, ${message}, ${type || "info"})
        `;
      }
    } else {
      // Cria notificação para usuário específico
      await sql`
        INSERT INTO user_notifications (user_id, title, message, type)
        VALUES (${user_id}, ${title}, ${message}, ${type || "info"})
      `;
    }

    // Log de auditoria
    if (session) {
      await sql`
        INSERT INTO audit_logs (user_id, action, entity_type, new_value)
        VALUES (
          ${session.userId},
          'CREATE_NOTIFICATION',
          'notification',
          ${JSON.stringify({ title, message, type, is_global, user_id })}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await sql`DELETE FROM user_notifications WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
