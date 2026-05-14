import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { userId, reason, cancelPendingWithdrawals } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
    }

    const results: string[] = [];

    // 1. Bloquear usuario
    await sql`
      UPDATE profiles 
      SET 
        is_blocked = true,
        block_reason = ${reason || 'Atividade suspeita detectada'},
        blocked_at = NOW(),
        updated_at = NOW()
      WHERE id = ${userId}
    `;
    results.push("Usuario bloqueado");

    // 2. Cancelar saques pendentes se solicitado
    if (cancelPendingWithdrawals) {
      const pendingWithdrawals = await sql`
        SELECT id, amount, net_amount FROM withdrawals 
        WHERE user_id = ${userId} AND status IN ('pending', 'processing', 'pending_approval')
      `;

      for (const w of pendingWithdrawals) {
        // Devolver saldo ao usuario
        await sql`
          UPDATE profiles 
          SET balance = balance + ${w.amount}
          WHERE id = ${userId}
        `;
        
        // Cancelar saque
        await sql`
          UPDATE withdrawals 
          SET status = 'cancelled', notes = ${reason || 'Cancelado por atividade suspeita'}, updated_at = NOW()
          WHERE id = ${w.id}
        `;
        
        results.push(`Saque ${w.id} cancelado, R$${w.amount} devolvido`);
      }
    }

    // 3. Invalidar sessoes
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
    results.push("Sessoes invalidadas");

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Erro ao bloquear usuario:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
