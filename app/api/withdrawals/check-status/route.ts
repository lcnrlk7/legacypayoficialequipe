import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { getAcquirerForUser } from "@/lib/acquirers";
import { MedusaPayments } from "@/lib/acquirers/medusa";

/**
 * Verifica e atualiza o status de um saque consultando a adquirente
 * POST /api/withdrawals/check-status
 * Body: { withdrawal_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await verifyAuth(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { withdrawal_id } = await request.json();

    if (!withdrawal_id) {
      return NextResponse.json({ error: "ID do saque não informado" }, { status: 400 });
    }

    // Buscar saque do usuário
    const withdrawals = await sql`
      SELECT w.*, p.route_type
      FROM withdrawals w
      JOIN profiles p ON w.user_id = p.id
      WHERE w.id = ${withdrawal_id} AND w.user_id = ${sessionUser.id}
    `;

    if (withdrawals.length === 0) {
      return NextResponse.json({ error: "Saque não encontrado" }, { status: 404 });
    }

    const withdrawal = withdrawals[0];

    // Se já está em status final, não precisa verificar
    if (withdrawal.status === "completed" || withdrawal.status === "failed" || withdrawal.status === "rejected") {
      return NextResponse.json({
        success: true,
        status: withdrawal.status,
        message: "Saque já está em status final"
      });
    }

    // Se não tem ID da adquirente, não podemos verificar
    if (!withdrawal.acquirer_withdrawal_id) {
      return NextResponse.json({
        success: false,
        status: withdrawal.status,
        message: "Saque não possui ID da adquirente para verificação"
      });
    }

    // Buscar configuração da adquirente
    const acquirer = await getAcquirerForUser(sessionUser.id);
    
    if (!acquirer || acquirer.code !== "medusa") {
      return NextResponse.json({
        success: false,
        status: withdrawal.status,
        message: "Verificação automática disponível apenas para Medusa"
      });
    }

    // Consultar status na Medusa
    const client = new MedusaPayments({
      secretKey: acquirer.api_key,
      licenseKey: acquirer.api_secret
    });

    const medusaStatus = await client.getWithdrawalStatus(withdrawal.acquirer_withdrawal_id);

    if (!medusaStatus) {
      return NextResponse.json({
        success: false,
        status: withdrawal.status,
        message: "Não foi possível consultar status na adquirente"
      });
    }

    // Mapear status da Medusa
    let newStatus = withdrawal.status;
    const medusaStatusLower = medusaStatus.status.toLowerCase();

    if (["approved", "paid", "completed", "success"].includes(medusaStatusLower)) {
      newStatus = "completed";
    } else if (["refused", "failed", "cancelled", "error"].includes(medusaStatusLower)) {
      newStatus = "failed";
    } else if (["pending", "processing", "waiting"].includes(medusaStatusLower)) {
      newStatus = "processing";
    }

    // Se status mudou, atualizar no banco
    if (newStatus !== withdrawal.status) {
      await sql`
        UPDATE withdrawals 
        SET status = ${newStatus}, processed_at = NOW()
        WHERE id = ${withdrawal_id}
      `;

      // Se falhou, devolver saldo
      if (newStatus === "failed") {
        await sql`
          UPDATE profiles 
          SET balance = balance + ${Number(withdrawal.amount)}
          WHERE id = ${sessionUser.id}
        `;

        // Notificar usuário
        await sql`
          INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
          VALUES (
            ${crypto.randomUUID()},
            ${sessionUser.id},
            'Saque Falhou',
            ${`Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} falhou. O valor foi devolvido ao seu saldo.`},
            'error',
            NOW()
          )
        `;
      }

      // Se completou, notificar usuário
      if (newStatus === "completed") {
        await sql`
          INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
          VALUES (
            ${crypto.randomUUID()},
            ${sessionUser.id},
            'Saque Concluído!',
            ${`Seu saque de R$ ${Number(withdrawal.net_amount).toFixed(2)} foi enviado para a chave PIX ${withdrawal.pix_key}.`},
            'success',
            NOW()
          )
        `;
      }

      return NextResponse.json({
        success: true,
        status: newStatus,
        previous_status: withdrawal.status,
        medusa_status: medusaStatus.status,
        message: `Status atualizado de ${withdrawal.status} para ${newStatus}`
      });
    }

    return NextResponse.json({
      success: true,
      status: withdrawal.status,
      medusa_status: medusaStatus.status,
      message: "Status não alterado"
    });

  } catch (error) {
    console.error("[Check Withdrawal Status] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status do saque" },
      { status: 500 }
    );
  }
}
