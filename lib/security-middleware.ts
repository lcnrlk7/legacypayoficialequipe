/**
 * Middleware de seguranca para detectar e bloquear ataques
 */

import { detectAttack, AttackDetectionResult } from "./sanitize";
import { logAttack } from "./attack-logger";
import { sql } from "@/lib/db";

export interface SecurityCheckResult {
  blocked: boolean;
  attackType?: string;
  severity?: string;
  field?: string;
}

/**
 * Verifica um objeto de dados em busca de ataques
 */
export async function checkForAttacks(
  data: Record<string, unknown>,
  ip: string,
  endpoint: string,
  userEmail?: string
): Promise<SecurityCheckResult> {
  for (const [field, value] of Object.entries(data)) {
    if (typeof value === "string" && value.length > 0) {
      const attack = detectAttack(value);
      
      if (attack.detected) {
        // Registrar ataque
        await logAttack({
          attackType: attack.attackType!,
          ipAddress: ip,
          userEmail: userEmail || "unknown",
          payload: value.substring(0, 500),
          endpoint,
          severity: attack.severity || "medium",
          blocked: true,
        });
        
        // Bloquear IP para ataques criticos/altos
        if (attack.severity === "critical" || attack.severity === "high") {
          try {
            await sql`
              INSERT INTO blocked_ips (ip_address, reason)
              VALUES (${ip}, ${`${attack.attackType} detectado em ${endpoint} - campo ${field}`})
              ON CONFLICT (ip_address) DO NOTHING
            `;
          } catch {
            // Ignora erro
          }
        }
        
        return {
          blocked: true,
          attackType: attack.attackType,
          severity: attack.severity,
          field,
        };
      }
    } else if (typeof value === "object" && value !== null) {
      // Verifica objetos aninhados recursivamente
      const nestedResult = await checkForAttacks(
        value as Record<string, unknown>,
        ip,
        endpoint,
        userEmail
      );
      if (nestedResult.blocked) {
        return nestedResult;
      }
    }
  }
  
  return { blocked: false };
}

/**
 * Verifica URL params em busca de ataques
 */
export async function checkUrlParams(
  searchParams: URLSearchParams,
  ip: string,
  endpoint: string
): Promise<SecurityCheckResult> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return checkForAttacks(params, ip, endpoint);
}

/**
 * Verifica headers em busca de ataques
 */
export async function checkHeaders(
  headers: Headers,
  ip: string,
  endpoint: string
): Promise<SecurityCheckResult> {
  const headersToCheck = ["user-agent", "referer", "origin", "x-forwarded-for"];
  
  for (const headerName of headersToCheck) {
    const value = headers.get(headerName);
    if (value) {
      const attack = detectAttack(value);
      if (attack.detected) {
        await logAttack({
          attackType: attack.attackType!,
          ipAddress: ip,
          payload: `Header ${headerName}: ${value.substring(0, 200)}`,
          endpoint,
          severity: attack.severity || "medium",
          blocked: true,
        });
        
        return {
          blocked: true,
          attackType: attack.attackType,
          severity: attack.severity,
          field: `header:${headerName}`,
        };
      }
    }
  }
  
  return { blocked: false };
}

/**
 * Nomes de ataques para exibicao
 */
export const ATTACK_NAMES: Record<string, string> = {
  XSS_ATTEMPT: "Cross-Site Scripting (XSS)",
  SQL_INJECTION: "SQL Injection",
  COMMAND_INJECTION: "Command Injection",
  PATH_TRAVERSAL: "Path Traversal",
  LDAP_INJECTION: "LDAP Injection",
  XML_INJECTION: "XML/XXE Injection",
  HEADER_INJECTION: "Header Injection",
  NOSQL_INJECTION: "NoSQL Injection",
  TEMPLATE_INJECTION: "Template Injection (SSTI)",
  LOG_INJECTION: "Log Injection",
};
