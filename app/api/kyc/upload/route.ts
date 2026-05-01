import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import { logKYCSubmission } from '@/lib/discord-webhook'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: 'Tipo de documento não informado' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou PDF.' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
    }

    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `kyc/${user.id}/${documentType}_${timestamp}.${extension}`;

    // Usar 'public' pois o store é público
    const blob = await put(filename, file, {
      access: 'public',
    });

    const docId = crypto.randomUUID();
    // Salvar a URL completa do blob para stores públicos
    await sql`
      INSERT INTO kyc_documents (id, user_id, document_type, file_url, file_name, status, created_at)
      VALUES (${docId}, ${user.id}, ${documentType}, ${blob.url}, ${file.name}, ${'pending'}, NOW())
    `;

    await sql`
      UPDATE profiles SET kyc_status = 'pending', updated_at = NOW() WHERE id = ${user.id}
    `;
    
    // Log para Discord
    logKYCSubmission({
      userId: user.id,
      userName: user.name || "N/A",
      userEmail: user.email,
      documentType: documentType,
      documentsCount: 1,
    });

    return NextResponse.json({ 
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      message: 'Documento enviado com sucesso'
    });
  } catch (error) {
    console.error('[KYC Upload] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Falha no upload: ' + errorMessage }, { status: 500 });
  }
}
