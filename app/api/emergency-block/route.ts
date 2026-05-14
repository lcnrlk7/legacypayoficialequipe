import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// API de emergencia para bloquear usuario fraudulento
// REMOVER APOS USO - v3 - sem coluna notes
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const userId = request.nextUrl.searchParams.get("userId");
  
  // Chave secreta para evitar acesso nao autorizado
  if (secret !== "legacy_emergency_block_2024") {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }
  
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
  }

  try {
    // 1. Criar colunas se nao existirem
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS block_reason TEXT`;
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP`;

    // 2. Bloquear usuario
    const result = await sql`
      UPDATE profiles 
      SET 
        is_blocked = true,
        block_reason = 'Bloqueado via API de emergencia - Fraude',
        blocked_at = NOW(),
        balance = 0,
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, name, email
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    // 3. Cancelar todos os saques pendentes
    const cancelledWithdrawals = await sql`
      UPDATE withdrawals 
      SET status = 'cancelled'
      WHERE user_id = ${userId} AND status IN ('pending', 'processing', 'pending_approval')
      RETURNING id, amount
    `;

    // 4. Verificar resultado
    const user = await sql`
      SELECT name, email, is_blocked, balance 
      FROM profiles 
      WHERE id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: "Usuario bloqueado com sucesso",
      user: user[0],
      cancelledWithdrawals: cancelledWithdrawals.length,
    });
  } catch (error) {
    console.error("Erro ao bloquear usuario:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
