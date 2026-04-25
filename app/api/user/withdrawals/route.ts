import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Create new withdrawal
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, pixKey, pixKeyType } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor invalido" }, { status: 400 });
    }

    if (!pixKey) {
      return NextResponse.json({ error: "Chave PIX obrigatoria" }, { status: 400 });
    }

    // Get system settings for fees and limits
    const settings = await sql`SELECT * FROM system_settings LIMIT 1`;
    const systemSettings = settings[0] || {
      withdrawal_fee_percentage: 1.5,
      min_withdrawal: 3,
      max_withdrawal: 50000,
    };

    const minWithdrawal = systemSettings.min_withdrawal || 3;
    const maxWithdrawal = systemSettings.max_withdrawal || 50000;
    const feePercentage = systemSettings.withdrawal_fee_percentage || 1.5;

    if (amount < minWithdrawal) {
      return NextResponse.json({ error: `Valor minimo: R$ ${minWithdrawal}` }, { status: 400 });
    }

    if (amount > maxWithdrawal) {
      return NextResponse.json({ error: `Valor maximo: R$ ${maxWithdrawal}` }, { status: 400 });
    }

    // Calculate fee
    const fee = (amount * feePercentage) / 100;
    const totalDebit = amount + fee;
    const netAmount = amount; // What recipient receives

    // Get user balance
    const userProfile = await sql`SELECT balance FROM profiles WHERE id = ${user.id}`;
    const userBalance = userProfile[0]?.balance || 0;

    if (totalDebit > userBalance) {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
    }

    // Determine if needs approval (above R$500)
    const needsApproval = amount > 500;
    const status = needsApproval ? "pending" : "processing";

    // Create withdrawal record
    const withdrawal = await sql`
      INSERT INTO withdrawals (
        user_id, 
        amount, 
        fee, 
        net_amount,
        pix_key, 
        pix_key_type,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${user.id}, 
        ${amount}, 
        ${fee}, 
        ${netAmount},
        ${pixKey}, 
        ${pixKeyType || 'PIX'},
        ${status},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    // Deduct from user balance
    await sql`
      UPDATE profiles 
      SET balance = balance - ${totalDebit},
          updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // Log the transaction
    await sql`
      INSERT INTO transactions (
        user_id,
        type,
        amount,
        fee,
        net_amount,
        status,
        description,
        reference_id,
        created_at
      ) VALUES (
        ${user.id},
        'withdrawal',
        ${amount},
        ${fee},
        ${netAmount},
        ${status},
        ${'Saque PIX para ' + pixKey},
        ${withdrawal[0].id},
        NOW()
      )
    `;

    return NextResponse.json({ 
      success: true, 
      withdrawal: withdrawal[0],
      message: needsApproval 
        ? "Saque enviado para aprovacao" 
        : "Saque em processamento"
    });
  } catch (error) {
    console.error("[API] Error creating withdrawal:", error);
    return NextResponse.json(
      { error: "Erro ao processar saque" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    let withdrawals;

    if (status) {
      withdrawals = await sql`
        SELECT * FROM withdrawals 
        WHERE user_id = ${user.id} AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      withdrawals = await sql`
        SELECT * FROM withdrawals 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ withdrawals: withdrawals || [] });
  } catch (error) {
    console.error("[v0] Error fetching user withdrawals:", error);
    return NextResponse.json(
      { error: "Erro ao buscar saques" },
      { status: 500 }
    );
  }
}
