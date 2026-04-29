import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

// Funcao para verificar se o usuario e admin
async function verifyAdmin() {
  const session = await getSession();
  if (!session) return null;
  
  const result = await sql`
    SELECT is_admin FROM profiles WHERE id = ${session.userId}
  `;
  
  if (result.length === 0 || !result[0].is_admin) return null;
  return session;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se e admin
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const id = searchParams.get("id");

    if (id) {
      const result = await sql`
        SELECT * FROM profiles WHERE id = ${id}
      `;
      return NextResponse.json(result[0] || null);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      const result = await sql`
        SELECT * FROM profiles 
        WHERE email ILIKE ${searchPattern} 
           OR name ILIKE ${searchPattern} 
           OR cpf_cnpj ILIKE ${searchPattern}
        LIMIT 10
      `;
      return NextResponse.json({ users: result || [] });
    }

    const users = await sql`
      SELECT * FROM profiles ORDER BY created_at DESC
    `;

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Error in admin users API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Criar novo usuario
export async function POST(request: NextRequest) {
  try {
    // Verificar se e admin
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    
    const body = await request.json();
    const { email, password, name, phone, cpf_cnpj, is_admin, route_type, fee_percentage, daily_limit } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existing = await sql`SELECT id FROM profiles WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Gerar chaves de API
    const id = crypto.randomUUID();
    const clientId = `lp_${crypto.randomUUID().replace(/-/g, "")}`;
    const clientSecret = `sk_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;

    // Criar usuário
    const result = await sql`
      INSERT INTO profiles (
        id, email, password_hash, name, phone, cpf_cnpj, 
        kyc_status, api_key, client_id, client_secret, 
        is_admin, is_active, balance, route_type, fee_percentage, daily_limit,
        created_at, updated_at
      )
      VALUES (
        ${id}, ${email}, ${passwordHash}, ${name || null}, ${phone || null}, ${cpf_cnpj || null},
        'pending', ${clientId}, ${clientId}, ${clientSecret},
        ${is_admin || false}, true, 0, ${route_type || 'white'}, ${fee_percentage || 4.99}, ${daily_limit || 50000},
        NOW(), NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, user: result[0] });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Verificar se e admin
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    
    const body = await request.json();
    const { userId, action, data } = body;

    if (action === "update") {
      if (data.name !== undefined) {
        await sql`UPDATE profiles SET name = ${data.name}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.email !== undefined) {
        await sql`UPDATE profiles SET email = ${data.email}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.kyc_status !== undefined) {
        await sql`UPDATE profiles SET kyc_status = ${data.kyc_status}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.fee_percentage !== undefined) {
        await sql`UPDATE profiles SET fee_percentage = ${data.fee_percentage}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.fixed_fee !== undefined) {
        await sql`UPDATE profiles SET fixed_fee = ${data.fixed_fee}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.balance !== undefined) {
        await sql`UPDATE profiles SET balance = ${data.balance}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.route_type !== undefined) {
        await sql`UPDATE profiles SET route_type = ${data.route_type}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.daily_limit !== undefined) {
        await sql`UPDATE profiles SET daily_limit = ${data.daily_limit}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.withdrawal_fee !== undefined) {
        await sql`UPDATE profiles SET withdrawal_fee = ${data.withdrawal_fee}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (data.is_active !== undefined) {
        await sql`UPDATE profiles SET is_active = ${data.is_active}, updated_at = NOW() WHERE id = ${userId}`;
      }

      return NextResponse.json({ success: true });
    }

    if (action === "toggle_status") {
      const userResult = await sql`
        SELECT is_active FROM profiles WHERE id = ${userId}
      `;
      
      const isActive = userResult[0]?.is_active;
      
      await sql`
        UPDATE profiles SET is_active = ${!isActive}, updated_at = NOW() WHERE id = ${userId}
      `;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in admin users API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
