import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { sql } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar token admin do painel CEO (ID do membro da equipe)
    const adminToken = request.headers.get("X-Admin-Token");
    
    let isAuthorized = false;
    
    // Verificar se o token e um ID valido de membro da equipe
    if (adminToken && adminToken.length > 0) {
      const teamMember = await sql`
        SELECT id, role FROM team_members WHERE id = ${adminToken} AND is_active = true
      `;
      
      if (teamMember.length > 0) {
        // Membro da equipe ativo - autorizado
        isAuthorized = true;
      }
    }
    
    // Se nao foi autorizado pelo token admin, tentar pelo cookie JWT
    if (!isAuthorized) {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth-token")?.value;
      
      if (token) {
        try {
          const { payload } = await jwtVerify(token, JWT_SECRET);
          const userId = payload.id as string;
          
          // Verificar se e admin no banco de dados
          const adminCheck = await sql`
            SELECT id, is_admin FROM profiles WHERE id = ${userId}
          `;
          
          if (adminCheck.length > 0 && adminCheck[0].is_admin === true) {
            isAuthorized = true;
          }
        } catch {
          // Token JWT invalido - ignorar
        }
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Nao autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validar status
    const validStatuses = ["pending", "processing", "completed", "cancelled", "failed", "rejected", "nao_autorizado"];
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

    // Status que devolvem saldo ao usuario
    const refundStatuses = ["cancelled", "failed", "rejected", "nao_autorizado"];
    
    // Se estiver alterando para um status de devolucao e o status anterior nao era de devolucao
    if (
      refundStatuses.includes(status) && 
      !refundStatuses.includes(oldStatus)
    ) {
      const newBalance = Number(withdrawal.balance) + Number(withdrawal.amount);
      
      await sql`
        UPDATE profiles 
        SET balance = ${newBalance}, updated_at = NOW()
        WHERE id = ${withdrawal.user_id}
      `;

      // Mensagem baseada no status
      const statusMessages: Record<string, { title: string; message: string }> = {
        cancelled: { 
          title: "Saque Cancelado", 
          message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} foi cancelado e o valor foi devolvido ao seu saldo.` 
        },
        failed: { 
          title: "Saque Falhou", 
          message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} falhou no processamento e o valor foi devolvido ao seu saldo.` 
        },
        rejected: { 
          title: "Saque Rejeitado", 
          message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} foi rejeitado e o valor foi devolvido ao seu saldo.` 
        },
        nao_autorizado: { 
          title: "Saque Nao Autorizado", 
          message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} nao foi autorizado e o valor foi devolvido ao seu saldo.` 
        },
      };

      const notification = statusMessages[status] || statusMessages.cancelled;

      await sql`
        INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${withdrawal.user_id},
          ${notification.title},
          ${notification.message},
          'warning',
          NOW()
        )
      `;
    }

    // Status que marcam como processado
    const processedStatuses = ["completed", "cancelled", "failed", "rejected", "nao_autorizado"];
    
    // Atualizar status
    await sql`
      UPDATE withdrawals 
      SET status = ${status}, 
          processed_at = ${processedStatuses.includes(status) ? new Date() : null}
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: `Status alterado de "${oldStatus}" para "${status}"`,
      refunded: refundStatuses.includes(status) && !refundStatuses.includes(oldStatus),
    });
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return NextResponse.json(
      { error: "Erro interno ao alterar status" },
      { status: 500 }
    );
  }
}
