import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }
    
    // Buscar transacao do usuario
    const result = await sql`
      SELECT id, status, amount, fee, net_amount, created_at, updated_at
      FROM transactions
      WHERE id = ${id} AND user_id = ${user.id}
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Transacao nao encontrada" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
    
  } catch (error) {
    console.error("Erro ao buscar transacao:", error)
    return NextResponse.json(
      { error: "Erro ao buscar transacao" },
      { status: 500 }
    )
  }
}
