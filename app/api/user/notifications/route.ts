import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await sql`
      SELECT * FROM user_notifications 
      WHERE user_id = ${session.userId} AND read = false
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error);
    return NextResponse.json({ notifications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { action, notificationId, notificationIds } = await request.json();

    if (action === "dismiss" && notificationId) {
      await sql`
        UPDATE user_notifications 
        SET read = true
        WHERE id = ${notificationId} AND user_id = ${session.userId}
      `;
    } else if (action === "dismiss_all" && notificationIds?.length) {
      await sql`
        UPDATE user_notifications 
        SET read = true
        WHERE id = ANY(${notificationIds}::uuid[]) AND user_id = ${session.userId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error updating notifications:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar notificações" },
      { status: 500 }
    );
  }
}
