import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Nota: A autenticação é feita pelo middleware para rotas /api/admin/*
// Não é necessário verificar novamente aqui

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: "ID da transação é obrigatório" }, { status: 400 });
    }

    // Buscar a transação
    const txResult = await sql`
      SELECT * FROM transactions WHERE id = ${transactionId}
    `;

    if (txResult.length === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    const transaction = txResult[0];

    if (transaction.status === "completed" || transaction.status === "paid") {
      return NextResponse.json({ 
        error: "Transação já está completada", 
        status: transaction.status 
      }, { status: 400 });
    }

    // Atualizar status da transação
    const paidAt = new Date().toISOString();
    await sql`
      UPDATE transactions 
      SET status = 'completed', paid_at = ${paidAt}, updated_at = NOW()
      WHERE id = ${transaction.id}
    `;

    // Atualizar saldo do usuário
    const profileResult = await sql`SELECT balance FROM profiles WHERE id = ${transaction.user_id}`;
    const currentBalance = Number(profileResult[0]?.balance) || 0;
    const netAmount = Number(transaction.net_amount) || Number(transaction.amount);
    const newBalance = currentBalance + netAmount;

    await sql`UPDATE profiles SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${transaction.user_id}`;

    // Criar notificação para o usuário
    try {
      await sql`
        INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${transaction.user_id},
          'Pagamento Confirmado!',
          ${`Seu pagamento de R$ ${netAmount.toFixed(2)} foi confirmado manualmente.`},
          'success',
          NOW()
        )
      `;
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    // Log de auditoria
    try {
      await sql`
        INSERT INTO audit_logs (id, user_id, action, action_type, description, metadata, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${transaction.user_id},
          'Transação confirmada manualmente pelo admin',
          'transaction_manual_confirm',
          ${`Transação ${transaction.id} confirmada. Valor líquido: R$ ${netAmount.toFixed(2)}`},
          ${JSON.stringify({ 
            transaction_id: transaction.id, 
            amount: Number(transaction.amount),
            net_amount: netAmount,
            previous_balance: currentBalance,
            new_balance: newBalance
          })},
          NOW()
        )
      `;
    } catch (logError) {
      console.error("Error creating audit log:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Transação confirmada com sucesso",
      transaction: {
        id: transaction.id,
        status: "completed",
        amount: Number(transaction.amount),
        netAmount,
        paidAt,
      },
      user: {
        id: transaction.user_id,
        previousBalance: currentBalance,
        newBalance,
      },
    });
  } catch (error) {
    console.error("Error confirming transaction:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao confirmar transação" },
      { status: 500 }
    );
  }
}
