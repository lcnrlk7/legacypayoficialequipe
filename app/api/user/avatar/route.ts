import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put, del } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Arquivo deve ser uma imagem" }, { status: 400 });
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem deve ter no maximo 5MB" }, { status: 400 });
    }

    // Buscar avatar antigo para deletar
    const oldAvatar = await sql`
      SELECT avatar_url FROM profiles WHERE id = ${user.id}
    `;

    // Upload para Vercel Blob
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `avatars/${user.id}-${Date.now()}.${extension}`;
    
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Atualizar no banco
    await sql`
      UPDATE profiles 
      SET avatar_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // Deletar avatar antigo se existir
    if (oldAvatar[0]?.avatar_url) {
      try {
        await del(oldAvatar[0].avatar_url);
      } catch {
        // Ignora erro ao deletar antigo
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl: blob.url,
    });
  } catch (error) {
    console.error("Erro ao fazer upload de avatar:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload da imagem" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Buscar avatar atual
    const current = await sql`
      SELECT avatar_url FROM profiles WHERE id = ${user.id}
    `;

    if (current[0]?.avatar_url) {
      // Deletar do Blob
      try {
        await del(current[0].avatar_url);
      } catch {
        // Ignora erro
      }
    }

    // Remover do banco
    await sql`
      UPDATE profiles 
      SET avatar_url = NULL, updated_at = NOW()
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover avatar:", error);
    return NextResponse.json(
      { error: "Erro ao remover imagem" },
      { status: 500 }
    );
  }
}
