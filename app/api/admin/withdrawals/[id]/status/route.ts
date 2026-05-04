import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || (user.role !== "admin" && user.role !== "ceo")) {
      return NextResponse.json(
        { error: "Nao autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validar status
    const validStatuses = ["pending", "processing", "completed", "cancelled", "failed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status invalido" },
        { status: 400 }
      );
    }

    // Buscar saque atual
    const withdrawals = await sql`
      SELECT w.*, p.balance, p.email
      FROM withdrawals w
      JOIN profiles p ON p.id = w.user_id
      WHERE w.id = ${id}
    `;

    if (withdrawals.length === 0) {
      return NextResponse.json(
        { error: "Saque nao encontrado" },
        { status: 404 }
      );
    }

    const withdrawal = withdrawals[0];
    const oldStatus = withdrawal.status;

    // Se estiver alterando para cancelled e o status anterior nao era cancelled/failed
    // devolver o saldo ao usuario
    if (
      (status === "cancelled" || status === "failed") && 
      oldStatus !== "cancelled" && 
      oldStatus !== "failed"
    ) {
      const newBalance = Number(withdrawal.balance) + Number(withdrawal.amount);
      
      await sql`
        UPDATE profiles 
        SET balance = ${newBalance}, updated_at = NOW()
        WHERE id = ${withdrawal.user_id}
      `;

      // Notificar usuario
      await sql`
        INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${withdrawal.user_id},
          'Saque Cancelado',
          ${'Seu saque de R$ ' + Number(withdrawal.amount).toFixed(2) + ' foi cancelado e o valor foi devolvido ao seu saldo.'},
          'warning',
          NOW()
        )
      `;

      console.log(`[Admin] Saque ${id} cancelado. Saldo devolvido: R$ ${Number(withdrawal.amount).toFixed(2)}`);
    }

    // Atualizar status
    await sql`
      UPDATE withdrawals 
      SET status = ${status}, 
          processed_at = ${status === "completed" || status === "cancelled" || status === "failed" ? new Date() : null}
      WHERE id = ${id}
    `;

    // Log da alteracao manual
    console.log(`[Admin] Status do saque ${id} alterado de "${oldStatus}" para "${status}" por ${user.email}`);

    return NextResponse.json({
      success: true,
      message: `Status alterado de "${oldStatus}" para "${status}"`,
      refunded: (status === "cancelled" || status === "failed") && oldStatus !== "cancelled" && oldStatus !== "failed",
    });
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return NextResponse.json(
      { error: "Erro ao alterar status" },
      { status: 500 }
    );
  }
}
