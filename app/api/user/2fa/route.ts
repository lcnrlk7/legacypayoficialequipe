import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { setup2FA, enable2FA, disable2FA, is2FAEnabled } from "@/lib/two-factor";

// GET - Verificar status do 2FA
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const enabled = await is2FAEnabled(session.userId);
    
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("Erro ao verificar 2FA:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Iniciar setup ou ativar 2FA
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { action, token } = body;

    if (action === "setup") {
      // Buscar email do usuario
      const user = await sql`SELECT email FROM profiles WHERE id = ${session.userId}`;
      if (user.length === 0) {
        return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
      }

      const result = await setup2FA(session.userId, user[0].email);
      return NextResponse.json({
        success: true,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      });
    }

    if (action === "enable") {
      if (!token) {
        return NextResponse.json({ error: "Codigo obrigatorio" }, { status: 400 });
      }

      const success = await enable2FA(session.userId, token);
      if (!success) {
        return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
  } catch (error) {
    console.error("Erro no 2FA:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Desativar 2FA
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    // Verificar senha antes de desativar
    const user = await sql`SELECT password_hash FROM profiles WHERE id = ${session.userId}`;
    if (user.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, user[0].password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 400 });
    }

    await disable2FA(session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao desativar 2FA:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
