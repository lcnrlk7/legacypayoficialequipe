/**
 * Utilitarios para sanitizacao de inputs e prevencao de ataques
 */

// ============================================
// PADROES DE DETECCAO DE ATAQUES
// ============================================

// XSS - Cross-Site Scripting
const XSS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /onerror/i,
  /onload/i,
  /onclick/i,
  /onmouseover/i,
  /onfocus/i,
  /onblur/i,
  /onchange/i,
  /onsubmit/i,
  /ondblclick/i,
  /onkeydown/i,
  /onkeyup/i,
  /onkeypress/i,
  /onmouseout/i,
  /onmouseenter/i,
  /onmouseleave/i,
  /eval\(/i,
  /document\./i,
  /window\./i,
  /alert\(/i,
  /confirm\(/i,
  /prompt\(/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg.*on/i,
  /<img.*on/i,
  /<body.*on/i,
  /<input.*on/i,
  /<form.*on/i,
  /data:text\/html/i,
  /data:application/i,
  /vbscript:/i,
  /expression\(/i,
  /url\(.*javascript/i,
  /fromCharCode/i,
  /String\.fromCharCode/i,
  /atob\(/i,
  /btoa\(/i,
  /fetch\(/i,
  /XMLHttpRequest/i,
  /\.innerHTML/i,
  /\.outerHTML/i,
  /\.insertAdjacentHTML/i,
  /document\.write/i,
  /document\.cookie/i,
  /localStorage/i,
  /sessionStorage/i,
  /xss\.report/i,
  /xss\./i,
];

// SQL Injection
const SQL_INJECTION_PATTERNS = [
  /'\s*OR\s*'1'\s*=\s*'1/i,
  /'\s*OR\s*1\s*=\s*1/i,
  /'\s*OR\s*'a'\s*=\s*'a/i,
  /'\s*OR\s*''='/i,
  /'\s*--/,
  /;\s*DROP\s+TABLE/i,
  /;\s*DELETE\s+FROM/i,
  /;\s*INSERT\s+INTO/i,
  /;\s*UPDATE\s+.*SET/i,
  /;\s*SELECT\s+.*FROM/i,
  /UNION\s+SELECT/i,
  /UNION\s+ALL\s+SELECT/i,
  /SELECT\s+.*FROM\s+.*WHERE/i,
  /INTO\s+OUTFILE/i,
  /INTO\s+DUMPFILE/i,
  /LOAD_FILE\(/i,
  /BENCHMARK\(/i,
  /SLEEP\(/i,
  /WAITFOR\s+DELAY/i,
  /xp_cmdshell/i,
  /xp_regread/i,
  /INFORMATION_SCHEMA/i,
  /sysobjects/i,
  /syscolumns/i,
  /pg_tables/i,
  /pg_catalog/i,
];

// Command Injection / OS Injection
const COMMAND_INJECTION_PATTERNS = [
  /;\s*cat\s+/i,
  /;\s*ls\s*/i,
  /;\s*rm\s+/i,
  /;\s*wget\s+/i,
  /;\s*curl\s+/i,
  /;\s*chmod\s+/i,
  /;\s*chown\s+/i,
  /;\s*nc\s+/i,
  /;\s*netcat\s+/i,
  /;\s*bash\s*/i,
  /;\s*sh\s*/i,
  /;\s*python\s*/i,
  /;\s*perl\s*/i,
  /;\s*php\s*/i,
  /;\s*ruby\s*/i,
  /;\s*node\s*/i,
  /\|\s*cat\s+/i,
  /\|\s*ls\s*/i,
  /\|\s*bash/i,
  /\|\s*sh\s/i,
  /`.*`/,
  /\$\(.*\)/,
  /&&\s*cat/i,
  /&&\s*rm/i,
  /&&\s*wget/i,
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /\/bin\/bash/i,
  /\/bin\/sh/i,
  /cmd\.exe/i,
  /powershell/i,
];

// Path Traversal / Directory Traversal
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/, 
  /\.\.%2f/i,
  /\.\.%5c/i,
  /%2e%2e%2f/i,
  /%2e%2e\//i,
  /\.\.%c0%af/i,
  /\.\.%c1%9c/i,
  /\/etc\//i,
  /\/var\//i,
  /\/usr\//i,
  /\/root\//i,
  /\/home\//i,
  /\/tmp\//i,
  /\/proc\//i,
  /C:\\Windows/i,
  /C:\\Users/i,
  /C:\\Program/i,
];

// LDAP Injection
const LDAP_INJECTION_PATTERNS = [
  /\)\(\|/,
  /\)\(\&/,
  /\*\)\(/,
  /\)\)\(/,
  /\(\|/,
  /\(\&/,
  /\)\(/,
];

// XML/XXE Injection
const XML_INJECTION_PATTERNS = [
  /<!ENTITY/i,
  /<!DOCTYPE.*SYSTEM/i,
  /<!DOCTYPE.*PUBLIC/i,
  /SYSTEM\s*"file:/i,
  /SYSTEM\s*"http:/i,
  /SYSTEM\s*"https:/i,
  /<!\[CDATA\[/i,
  /xmlns:/i,
];

// Header Injection / CRLF
const HEADER_INJECTION_PATTERNS = [
  /%0d/i,
  /%0a/i,
  /\r\n/,
  /\n/,
  /\r/,
  /Set-Cookie:/i,
  /Content-Type:/i,
  /Location:/i,
  /HTTP\/1/i,
];

// NoSQL Injection
const NOSQL_INJECTION_PATTERNS = [
  /\$where/i,
  /\$gt/i,
  /\$lt/i,
  /\$ne/i,
  /\$regex/i,
  /\$or/i,
  /\$and/i,
  /\$nin/i,
  /\$in/i,
  /\$exists/i,
  /\{\s*"\$.*":/,
  /\{\s*'\$.*':/,
];

// Template Injection (SSTI)
const TEMPLATE_INJECTION_PATTERNS = [
  /\{\{.*\}\}/,
  /\{\%.*\%\}/,
  /\$\{.*\}/,
  /<\%.*\%>/,
  /\#\{.*\}/,
  /\[\[.*\]\]/,
];

// Log Injection / Log Forging
const LOG_INJECTION_PATTERNS = [
  /\n.*\[ERROR\]/i,
  /\n.*\[WARN\]/i,
  /\n.*\[INFO\]/i,
  /\r\n.*\[/i,
];

// Tipos de ataque detectaveis
export type AttackType = 
  | "XSS_ATTEMPT"
  | "SQL_INJECTION"
  | "COMMAND_INJECTION"
  | "PATH_TRAVERSAL"
  | "LDAP_INJECTION"
  | "XML_INJECTION"
  | "HEADER_INJECTION"
  | "NOSQL_INJECTION"
  | "TEMPLATE_INJECTION"
  | "LOG_INJECTION";

// Resultado da deteccao de ataque
export interface AttackDetectionResult {
  detected: boolean;
  attackType?: AttackType;
  severity?: "low" | "medium" | "high" | "critical";
  pattern?: string;
}

/**
 * Detecta qualquer tipo de ataque em uma string
 */
export function detectAttack(input: string): AttackDetectionResult {
  if (!input) return { detected: false };

  // XSS - Critico
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "XSS_ATTEMPT", 
        severity: "critical",
        pattern: pattern.toString()
      };
    }
  }

  // SQL Injection - Critico
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "SQL_INJECTION", 
        severity: "critical",
        pattern: pattern.toString()
      };
    }
  }

  // Command Injection - Critico
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "COMMAND_INJECTION", 
        severity: "critical",
        pattern: pattern.toString()
      };
    }
  }

  // Path Traversal - Alto
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "PATH_TRAVERSAL", 
        severity: "high",
        pattern: pattern.toString()
      };
    }
  }

  // NoSQL Injection - Alto
  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "NOSQL_INJECTION", 
        severity: "high",
        pattern: pattern.toString()
      };
    }
  }

  // XML Injection - Alto
  for (const pattern of XML_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "XML_INJECTION", 
        severity: "high",
        pattern: pattern.toString()
      };
    }
  }

  // Template Injection - Alto
  for (const pattern of TEMPLATE_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "TEMPLATE_INJECTION", 
        severity: "high",
        pattern: pattern.toString()
      };
    }
  }

  // LDAP Injection - Medio
  for (const pattern of LDAP_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "LDAP_INJECTION", 
        severity: "medium",
        pattern: pattern.toString()
      };
    }
  }

  // Header Injection - Medio
  for (const pattern of HEADER_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "HEADER_INJECTION", 
        severity: "medium",
        pattern: pattern.toString()
      };
    }
  }

  // Log Injection - Baixo
  for (const pattern of LOG_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { 
        detected: true, 
        attackType: "LOG_INJECTION", 
        severity: "low",
        pattern: pattern.toString()
      };
    }
  }

  return { detected: false };
}

/**
 * Verifica se uma string contem padroes de XSS
 */
export function containsXSS(input: string): boolean {
  if (!input) return false;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Verifica se uma string contem qualquer tipo de ataque
 */
export function containsAttack(input: string): boolean {
  return detectAttack(input).detected;
}

/**
 * Remove tags HTML de uma string
 */
export function stripHtml(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Escapa caracteres HTML especiais
 */
export function escapeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitiza uma string removendo conteudo perigoso
 */
export function sanitizeString(input: string): string {
  if (!input) return "";
  
  // Remove tags HTML
  let sanitized = stripHtml(input);
  
  // Remove caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
  
  // Limita tamanho
  sanitized = sanitized.substring(0, 500);
  
  return sanitized.trim();
}

/**
 * Sanitiza um nome (mais restritivo)
 * Permite apenas: letras (com acentos), espacos e hifens
 * Bloqueia: < > " ' ` & ; ( ) { } [ ] / \ = + * # @ ! $ % ^ | ~
 */
export function sanitizeName(input: string): string {
  if (!input) return "";
  
  // Remove tudo que nao seja letra, espaco ou hifen
  let sanitized = input.replace(/[^a-zA-ZÀ-ÿ\s\-]/g, "");
  
  // Remove espacos extras
  sanitized = sanitized.replace(/\s+/g, " ");
  
  // Limita tamanho
  sanitized = sanitized.substring(0, 100);
  
  return sanitized.trim();
}

/**
 * Valida nome - apenas letras, espacos e hifens
 */
export function isValidName(input: string): { valid: boolean; error?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: "Nome é obrigatório" };
  }
  
  // Bloqueia caracteres perigosos
  const dangerousChars = /[<>"'`&;(){}[\]\/\\=+*#@!$%^|~0-9]/;
  if (dangerousChars.test(input)) {
    return { valid: false, error: "Nome contém caracteres não permitidos" };
  }
  
  // Verifica XSS
  if (containsXSS(input)) {
    return { valid: false, error: "Conteúdo não permitido detectado" };
  }
  
  // Minimo 2 caracteres
  if (input.trim().length < 2) {
    return { valid: false, error: "Nome deve ter pelo menos 2 caracteres" };
  }
  
  // Maximo 100 caracteres
  if (input.length > 100) {
    return { valid: false, error: "Nome deve ter no máximo 100 caracteres" };
  }
  
  return { valid: true };
}

/**
 * Valida email - formato basico e sem caracteres perigosos
 */
export function isValidEmailStrict(input: string): { valid: boolean; error?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: "Email é obrigatório" };
  }
  
  // Verifica XSS
  if (containsXSS(input)) {
    return { valid: false, error: "Conteúdo não permitido detectado" };
  }
  
  // Bloqueia caracteres perigosos (exceto @ e . que sao necessarios)
  const dangerousChars = /[<>"'`&;(){}[\]\\=*#!$%^|~\s]/;
  if (dangerousChars.test(input)) {
    return { valid: false, error: "Email contém caracteres não permitidos" };
  }
  
  // Regex para email valido
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(input)) {
    return { valid: false, error: "Email inválido" };
  }
  
  // Maximo 254 caracteres (RFC 5321)
  if (input.length > 254) {
    return { valid: false, error: "Email muito longo" };
  }
  
  return { valid: true };
}

/**
 * Valida telefone - apenas numeros
 */
export function isValidPhone(input: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: true, sanitized: "" }; // Telefone opcional
  }
  
  // Verifica XSS
  if (containsXSS(input)) {
    return { valid: false, error: "Conteúdo não permitido detectado" };
  }
  
  // Remove tudo que nao seja numero
  const sanitized = input.replace(/\D/g, "");
  
  // Verifica se tem apenas numeros no original (alem de formatacao)
  const allowedChars = /^[\d\s\-().+]+$/;
  if (!allowedChars.test(input)) {
    return { valid: false, error: "Telefone contém caracteres não permitidos" };
  }
  
  // Telefone brasileiro: 10 ou 11 digitos
  if (sanitized.length < 10 || sanitized.length > 11) {
    return { valid: false, error: "Telefone deve ter 10 ou 11 dígitos" };
  }
  
  return { valid: true, sanitized };
}

/**
 * Valida CPF - apenas numeros
 */
export function isValidCPFStrict(input: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: true, sanitized: "" }; // CPF opcional
  }
  
  // Verifica XSS
  if (containsXSS(input)) {
    return { valid: false, error: "Conteúdo não permitido detectado" };
  }
  
  // Remove tudo que nao seja numero
  const sanitized = input.replace(/\D/g, "");
  
  // Verifica se tem apenas numeros no original (alem de formatacao)
  const allowedChars = /^[\d\s\-./]+$/;
  if (!allowedChars.test(input)) {
    return { valid: false, error: "CPF contém caracteres não permitidos" };
  }
  
  // CPF tem 11 digitos
  if (sanitized.length !== 11) {
    return { valid: false, error: "CPF deve ter 11 dígitos" };
  }
  
  // Verifica se todos os digitos sao iguais
  if (/^(\d)\1+$/.test(sanitized)) {
    return { valid: false, error: "CPF inválido" };
  }
  
  return { valid: true, sanitized };
}

/**
 * Valida e sanitiza input, retornando erro se detectar XSS
 */
export function validateAndSanitize(input: string, fieldName: string): { 
  valid: boolean; 
  sanitized: string; 
  error?: string 
} {
  if (!input) {
    return { valid: true, sanitized: "" };
  }
  
  // Verifica XSS
  if (containsXSS(input)) {
    return { 
      valid: false, 
      sanitized: "", 
      error: `Campo ${fieldName} contém conteúdo não permitido` 
    };
  }
  
  // Sanitiza
  const sanitized = sanitizeString(input);
  
  return { valid: true, sanitized };
}
