import { sql } from "@/lib/db";

export type AuditActionType =
  | "login"
  | "logout"
  | "transaction"
  | "withdrawal"
  | "deposit"
  | "pix_key"
  | "profile_update"
  | "kyc"
  | "api_key"
  | "webhook"
  | "admin_action"
  | "reward"
  | "other";

interface AuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  action: string;
  actionType: AuditActionType;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditAction(params: AuditLogParams) {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, old_value, new_value, ip_address, user_agent)
      VALUES (
        ${params.userId || null},
        ${params.action},
        ${params.actionType},
        ${JSON.stringify({ email: params.userEmail, name: params.userName })},
        ${JSON.stringify(params.metadata || {})},
        ${params.ipAddress || null},
        ${params.userAgent || null}
      )
    `;
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}

// Server-side version for API routes
export async function logAuditActionServer(params: AuditLogParams) {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, old_value, new_value, ip_address, user_agent)
      VALUES (
        ${params.userId || null},
        ${params.action},
        ${params.actionType},
        ${JSON.stringify({ email: params.userEmail, name: params.userName })},
        ${JSON.stringify(params.metadata || {})},
        ${params.ipAddress || null},
        ${params.userAgent || null}
      )
    `;
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
