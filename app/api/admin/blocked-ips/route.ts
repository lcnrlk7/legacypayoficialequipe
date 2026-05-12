import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

const sql = neon(process.env.DATABASE_URL!);

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "ceo")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const blockedIps = await sql`
      SELECT bi.*, p.email as user_email
      FROM blocked_ips bi
      LEFT JOIN profiles p ON p.id = bi.user_id
      ORDER BY bi.created_at DESC
    `;

    return NextResponse.json({ blocked_ips: blockedIps });
  } catch (error) {
    console.error("Erro ao buscar IPs bloqueados:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "ceo")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { ip_address, reason, user_id } = body;

    if (!ip_address) {
      return NextResponse.json({ error: "IP é obrigatório" }, { status: 400 });
    }

    // Verificar se IP já está bloqueado
    const existing = await sql`
      SELECT id FROM blocked_ips WHERE ip_address = ${ip_address}
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: "IP já está bloqueado" }, { status: 400 });
    }

    // Bloquear IP
    const result = await sql`
      INSERT INTO blocked_ips (ip_address, reason, blocked_by, user_id)
      VALUES (${ip_address}, ${reason || "Bloqueio manual"}, ${session.id}, ${user_id || null})
      RETURNING *
    `;

    // Se tem user_id, desativar a conta também
    if (user_id) {
      await sql`
        UPDATE profiles SET is_active = false, updated_at = NOW() WHERE id = ${user_id}
      `;
    }

    return NextResponse.json({ success: true, blocked_ip: result[0] });
  } catch (error) {
    console.error("Erro ao bloquear IP:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "ceo")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await sql`DELETE FROM blocked_ips WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao desbloquear IP:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
