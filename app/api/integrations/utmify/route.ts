import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { 
  getUserUtmifyCredential, 
  saveUserUtmifyCredential, 
  removeUserUtmifyCredential,
  testUtmifyConnection 
} from "@/lib/utmify";

// GET - Buscar status da integracao
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const token = await getUserUtmifyCredential(user.id);

    return NextResponse.json({
      integrated: !!token,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}` : null,
    });
  } catch (error) {
    console.error("Erro ao buscar integracao UTMify:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Salvar ou atualizar token
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { apiToken, testConnection } = await request.json();

    if (!apiToken || apiToken.trim().length < 10) {
      return NextResponse.json(
        { error: "Token invalido. O token deve ter pelo menos 10 caracteres." },
        { status: 400 }
      );
    }

    // Testar conexao se solicitado
    if (testConnection) {
      const testResult = await testUtmifyConnection(apiToken.trim());
      if (!testResult.success) {
        return NextResponse.json(
          { error: `Falha ao conectar com UTMify: ${testResult.error}` },
          { status: 400 }
        );
      }
    }

    // Salvar token
    const saved = await saveUserUtmifyCredential(user.id, apiToken.trim());

    if (!saved) {
      return NextResponse.json(
        { error: "Erro ao salvar token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Integracao UTMify configurada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao salvar integracao UTMify:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Remover integracao
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const removed = await removeUserUtmifyCredential(user.id);

    if (!removed) {
      return NextResponse.json(
        { error: "Erro ao remover integracao" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Integracao UTMify removida com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao remover integracao UTMify:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
