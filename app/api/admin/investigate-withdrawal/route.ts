import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "e84e68e8-36e0-42a6-9204-674673406797";

  try {
    // Buscar o saque
    const withdrawal = await sql`
      SELECT w.*, p.email, p.name, p.cpf_cnpj, p.created_at as user_created_at, p.balance, p.id as profile_id
      FROM withdrawals w
      JOIN profiles p ON w.user_id = p.id
      WHERE w.id = ${id}
    `;

    if (withdrawal.length === 0) {
      return NextResponse.json({ error: "Saque não encontrado" }, { status: 404 });
    }

    const w = withdrawal[0];

    // Buscar outros saques do usuario
    const otherWithdrawals = await sql`
      SELECT id, amount, pix_key, status, created_at 
      FROM withdrawals 
      WHERE user_id = ${w.user_id}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Buscar transacoes do usuario
    const transactions = await sql`
      SELECT id, amount, status, created_at 
      FROM transactions 
      WHERE user_id = ${w.user_id}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Buscar sessoes do usuario
    const sessions = await sql`
      SELECT id, ip_address, user_agent, created_at, expires_at
      FROM sessions
      WHERE user_id = ${w.profile_id}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Buscar logs de ataque
    const attacks = await sql`
      SELECT * FROM attack_logs
      WHERE user_id = ${w.profile_id}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      withdrawal: {
        id: w.id,
        usuario: w.name,
        email: w.email,
        cpf_cnpj: w.cpf_cnpj,
        valor: w.amount,
        taxa: w.fee,
        valor_liquido: w.net_amount,
        chave_pix: w.pix_key,
        tipo_chave: w.pix_key_type,
        status: w.status,
        criado_em: w.created_at,
        usuario_criado_em: w.user_created_at,
        saldo_atual: w.balance,
      },
      outros_saques: otherWithdrawals,
      transacoes: transactions,
      sessoes: sessions,
      ataques: attacks,
    });
  } catch (error) {
    console.error("Erro ao investigar:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
