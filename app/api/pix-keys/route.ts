import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const pixKeys = await sql`
      SELECT id, key_type, key_value, is_primary, created_at
      FROM pix_keys
      WHERE user_id = ${user.id}
      ORDER BY is_primary DESC, created_at DESC
    `;

    return NextResponse.json({ pixKeys: pixKeys || [] });
  } catch (error) {
    console.error("Error in pix-keys API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keyType, keyValue, isPrimary } = body;

    if (!keyType) {
      return NextResponse.json(
        { error: "Tipo de chave é obrigatório" },
        { status: 400 }
      );
    }

    const value = keyType === "random" ? crypto.randomUUID() : keyValue;

    if (!value) {
      return NextResponse.json(
        { error: "Valor da chave é obrigatório" },
        { status: 400 }
      );
    }

    // Se for definir como primária, remover flag das outras
    if (isPrimary) {
      await sql`
        UPDATE pix_keys SET is_primary = false WHERE user_id = ${user.id}
      `;
    }

    const id = crypto.randomUUID();
    const result = await sql`
      INSERT INTO pix_keys (id, user_id, key_type, key_value, is_primary, created_at)
      VALUES (${id}, ${user.id}, ${keyType}, ${value}, ${isPrimary || false}, NOW())
      RETURNING id, key_type, key_value, is_primary, created_at
    `;

    const pixKey = result[0];

    // Registrar log de auditoria (try-catch para não bloquear a operação principal)
    try {
      await sql`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${user.id},
          ${'PIX_KEY_CREATED'},
          ${'pix_key'},
          ${id},
          ${JSON.stringify({ key_type: keyType, is_primary: isPrimary || false })},
          NOW()
        )
      `;
    } catch (auditError) {
      console.error("Error creating audit log:", auditError);
    }

    return NextResponse.json({ success: true, pixKey });
  } catch (error) {
    console.error("Error creating pix key:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json(
        { error: "ID da chave é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a chave pertence ao usuário
    const existingKey = await sql`
      SELECT id, key_type, key_value FROM pix_keys
      WHERE id = ${keyId} AND user_id = ${user.id}
    `;

    if (existingKey.length === 0) {
      return NextResponse.json(
        { error: "Chave não encontrada" },
        { status: 404 }
      );
    }

    const pixKey = existingKey[0];

    await sql`
      DELETE FROM pix_keys WHERE id = ${keyId} AND user_id = ${user.id}
    `;

    // Registrar log de auditoria
    await sql`
      INSERT INTO audit_logs (id, user_id, action, entity_id, entity_type, description, metadata, created_at)
      VALUES (
        ${crypto.randomUUID()},
        ${user.id},
        'PIX_KEY_REMOVED',
        ${keyId},
        'pix_key',
        ${`Chave ${pixKey.key_type.toUpperCase()} removida`},
        ${JSON.stringify({ pix_key_id: keyId, key_type: pixKey.key_type })},
        NOW()
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pix key:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
