import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getCurrentUser } from "@/lib/auth";

const sql = neon(process.env.DATABASE_URL!);

// GET - Buscar usuario por email, CPF ou telefone
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase();

    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: "Digite pelo menos 3 caracteres para buscar" },
        { status: 400 }
      );
    }

    // Buscar usuario por email, CPF ou telefone
    const result = await sql`
      SELECT id, name, email, 
        CASE 
          WHEN cpf_cnpj IS NOT NULL THEN 
            CONCAT(SUBSTRING(cpf_cnpj, 1, 3), '.***.***-', SUBSTRING(cpf_cnpj, LENGTH(cpf_cnpj)-1, 2))
          ELSE NULL 
        END as cpf_masked,
        CASE 
          WHEN phone IS NOT NULL THEN 
            CONCAT(SUBSTRING(phone, 1, 4), '****', SUBSTRING(phone, LENGTH(phone)-3, 4))
          ELSE NULL 
        END as phone_masked,
        avatar_url
      FROM profiles 
      WHERE (
        LOWER(email) = ${query} 
        OR REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '-', ''), '/', '') = REPLACE(REPLACE(REPLACE(${query}, '.', ''), '-', ''), '/', '')
        OR REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '') = REPLACE(REPLACE(REPLACE(REPLACE(${query}, '(', ''), ')', ''), '-', ''), ' ', '')
      )
      AND id != ${user.id}
      AND is_active = true
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        found: false,
        message: "Usuario nao encontrado",
      });
    }

    const foundUser = result[0];

    // Mascarar email para privacidade
    const emailParts = foundUser.email.split("@");
    const maskedEmail = emailParts[0].substring(0, 2) + "***@" + emailParts[1];

    return NextResponse.json({
      success: true,
      found: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email_masked: maskedEmail,
        cpf_masked: foundUser.cpf_masked,
        phone_masked: foundUser.phone_masked,
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
