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
 * Verifica em duas tabelas: profiles (is_admin) e team_members (CEO/admin)
 * Retorna a sessao do admin ou null se nao for admin
 */
export async function verifyAdmin(): Promise<AdminSession | null> {
  try {
    const session = await getSession();
    if (!session) return null;
    
    // Primeiro verifica na tabela profiles
    const profileResult = await sql`
      SELECT id, email, name, is_admin 
      FROM profiles 
      WHERE id = ${session.userId} AND is_admin = true AND is_active = true
    `;
    
    if (profileResult.length > 0) {
      return {
        userId: profileResult[0].id,
        email: profileResult[0].email,
        name: profileResult[0].name,
        isAdmin: profileResult[0].is_admin
      };
    }
    
    // Se nao for admin em profiles, verifica na tabela team_members
    const teamResult = await sql`
      SELECT tm.id, tm.email, tm.name, tm.role, tm.is_active
      FROM team_members tm
      WHERE tm.email = ${session.email} AND tm.is_active = true
      AND tm.role IN ('ceo', 'admin', 'superadmin', 'CEO')
    `;
    
    if (teamResult.length > 0) {
      return {
        userId: session.userId,
        email: teamResult[0].email,
        name: teamResult[0].name,
        isAdmin: true
      };
    }
    
    return null;
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
