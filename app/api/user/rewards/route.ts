import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ rewards: [] });
    }

    const rewards = await sql`
      SELECT * FROM rewards 
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error("[v0] Error fetching rewards:", error);
    return NextResponse.json({ rewards: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { rewardType, amount } = await request.json();

    // Check if reward already claimed
    const existing = await sql`
      SELECT * FROM rewards 
      WHERE user_id = ${session.userId} AND type = ${rewardType}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Premiação já solicitada" },
        { status: 400 }
      );
    }

    // Create reward request
    await sql`
      INSERT INTO rewards (user_id, type, amount, status)
      VALUES (${session.userId}, ${rewardType}, ${amount}, 'pending')
    `;

    // Create notification
    await sql`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES (
        ${session.userId},
        'Premiação Solicitada!',
        ${'Você solicitou sua premiação de R$ ' + amount.toLocaleString('pt-BR') + '. Enviaremos para o endereço informado em breve.'},
        'success'
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error claiming reward:", error);
    return NextResponse.json(
      { error: "Erro ao solicitar premiação" },
      { status: 500 }
    );
  }
}
