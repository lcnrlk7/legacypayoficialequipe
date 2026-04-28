import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export interface AdminSession {
  userId: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

/**
 * Verifica se o usuario atual e admin
 * Retorna a sessao do admin ou null se nao for admin
 */
export async function verifyAdmin(): Promise<AdminSession | null> {
  try {
    const session = await getSession();
    if (!session) return null;
    
    const result = await sql`
      SELECT id, email, name, is_admin 
      FROM profiles 
      WHERE id = ${session.userId} AND is_admin = true AND is_active = true
    `;
    
    if (result.length === 0) return null;
    
    return {
      userId: result[0].id,
      email: result[0].email,
      name: result[0].name,
      isAdmin: result[0].is_admin
    };
  } catch (error) {
    console.error("[Admin Auth] Error verifying admin:", error);
    return null;
  }
}

/**
 * Resposta padrao para acesso negado
 */
export function accessDeniedResponse() {
  return NextResponse.json(
    { error: "Acesso negado. Voce precisa ser administrador." },
    { status: 403 }
  );
}

/**
 * Wrapper para proteger rotas admin
 * Uso: const admin = await requireAdmin(); if (!admin) return accessDeniedResponse();
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  return verifyAdmin();
}
