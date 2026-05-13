import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";


// GET - Buscar usuario por email
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("q")?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Digite um email valido" },
        { status: 400 }
      );
    }

    // Buscar usuario por email exato
    const result = await sql`
      SELECT id, name, email, avatar_url
      FROM profiles 
      WHERE LOWER(email) = ${email}
      AND id != ${user.id}
      AND is_active = true
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        found: false,
        message: "Usuario nao encontrado com esse email",
      });
    }

    const foundUser = result[0];

    // Mascarar email para privacidade (ex: ha***@gmail.com)
    const emailParts = foundUser.email.split("@");
    const maskedEmail = emailParts[0].substring(0, 2) + "***@" + emailParts[1];

    return NextResponse.json({
      success: true,
      found: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email_masked: maskedEmail,
        avatar_url: foundUser.avatar_url,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuario:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuario" },
      { status: 500 }
    );
  }
}
