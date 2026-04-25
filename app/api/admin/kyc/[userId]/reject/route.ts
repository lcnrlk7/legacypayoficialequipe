import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { reason } = body;

    // Verificar se usuario existe
    const userCheck = await sql`
      SELECT id, name, email FROM profiles WHERE id = ${userId}
    `;

    if (userCheck.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    // Atualizar status KYC para rejeitado
    await sql`
      UPDATE profiles 
      SET kyc_status = 'rejected', updated_at = NOW()
      WHERE id = ${userId}
    `;

    // Atualizar documentos para rejeitado
    await sql`
      UPDATE kyc_documents
      SET status = 'rejected', rejection_reason = ${reason || 'Documentos invalidos'}
      WHERE user_id = ${userId} AND status = 'pending'
    `;

    // Registrar log de auditoria
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${session.userId},
        'KYC_REJECTED',
        'kyc',
        ${userId},
        ${JSON.stringify({ reason, rejectedBy: session.userId })},
        NOW()
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: "KYC rejeitado" 
    });
  } catch (error) {
    console.error("Erro ao rejeitar KYC:", error);
    return NextResponse.json(
      { error: "Erro ao rejeitar KYC" },
      { status: 500 }
    );
  }
}
