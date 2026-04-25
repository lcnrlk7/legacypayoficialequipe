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
    const { skipDocuments } = body;

    // Verificar se usuario existe
    const userCheck = await sql`
      SELECT id, name, email, kyc_status FROM profiles WHERE id = ${userId}
    `;

    if (userCheck.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    // Atualizar status KYC para aprovado
    await sql`
      UPDATE profiles 
      SET kyc_status = 'approved', updated_at = NOW()
      WHERE id = ${userId}
    `;

    // Se tiver documentos pendentes, aprovar tambem
    if (!skipDocuments) {
      await sql`
        UPDATE kyc_documents
        SET status = 'approved'
        WHERE user_id = ${userId} AND status = 'pending'
      `;
    }

    // Registrar log de auditoria
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${session.userId},
        'KYC_APPROVED',
        'kyc',
        ${userId},
        ${JSON.stringify({ skipDocuments, approvedBy: session.userId })},
        NOW()
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: skipDocuments 
        ? "KYC aprovado sem documentos" 
        : "KYC aprovado com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao aprovar KYC:", error);
    return NextResponse.json(
      { error: "Erro ao aprovar KYC" },
      { status: 500 }
    );
  }
}
