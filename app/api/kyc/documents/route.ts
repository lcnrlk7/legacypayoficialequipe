import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const documents = await sql`
      SELECT id, document_type, file_url, file_name, status, rejection_reason, created_at
      FROM kyc_documents
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    // Adicionar URL de visualização para cada documento
    // Se a URL já começa com http, é uma URL pública do blob - usar diretamente
    // Caso contrário, usar a rota de file para servir
    const docsWithUrls = (documents || []).map((doc: { file_url: string; [key: string]: unknown }) => ({
      ...doc,
      viewUrl: doc.file_url.startsWith('http') 
        ? doc.file_url 
        : `/api/kyc/file?pathname=${encodeURIComponent(doc.file_url)}`,
    }));

    return NextResponse.json({ documents: docsWithUrls });
  } catch (error) {
    console.error('Error fetching KYC documents:', error);
    return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 });
  }
}
