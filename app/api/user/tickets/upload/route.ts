import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Arquivo nao enviado" }, { status: 400 });
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (max 10MB)" }, { status: 400 });
    }

    // Validar tipo
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo nao permitido" }, { status: 400 });
    }

    // Upload para Vercel Blob
    const filename = `tickets/${session.userId}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      type: file.type,
      name: file.name,
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
