import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Buscar usuario
    const users = await sql`
      SELECT id, user_id, email, notifications_push, push_subscription 
      FROM profiles 
      WHERE email = ${email}
    `;

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];
    const userId = user.user_id || user.id; // UUID do usuario

    // Verificar se tabela push_subscriptions existe
    let subscriptions: unknown[] = [];
    let tableExists = false;
    
    try {
      subscriptions = await sql`
        SELECT id, endpoint, p256dh, auth, created_at 
        FROM push_subscriptions 
        WHERE user_id = ${userId}
      `;
      tableExists = true;
    } catch (e) {
      console.log("[v0] push_subscriptions table may not exist:", e);
    }

    // Verificar variaveis VAPID
    const vapidConfigured = !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

    return NextResponse.json({
      user: {
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        notifications_push: user.notifications_push,
        has_push_subscription_in_profile: !!user.push_subscription,
      },
      push_subscriptions_table: {
        exists: tableExists,
        count: subscriptions.length,
        subscriptions: subscriptions.map((s: any) => ({
          id: s.id,
          endpoint: s.endpoint?.substring(0, 50) + "...",
          has_p256dh: !!s.p256dh,
          has_auth: !!s.auth,
          p256dh_preview: s.p256dh ? s.p256dh.substring(0, 20) + "..." : null,
          auth_preview: s.auth ? s.auth.substring(0, 10) + "..." : null,
          created_at: s.created_at,
        })),
      },
      vapid_configured: vapidConfigured,
      vapid_public_key_set: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      vapid_private_key_set: !!process.env.VAPID_PRIVATE_KEY,
    });
  } catch (error) {
    console.error("[v0] Debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
