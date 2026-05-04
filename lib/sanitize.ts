/**
 * Utilitarios para sanitizacao de inputs e prevencao de XSS
 */

// Caracteres perigosos que indicam tentativa de XSS
const XSS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /onerror/i,
  /onload/i,
  /onclick/i,
  /onmouseover/i,
  /onfocus/i,
  /onblur/i,
  /eval\(/i,
  /document\./i,
  /window\./i,
  /alert\(/i,
  /confirm\(/i,
  /prompt\(/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg.*onload/i,
  /<img.*onerror/i,
  /data:text\/html/i,
  /vbscript:/i,
  /expression\(/i,
  /url\(.*javascript/i,
];

/**
 * Verifica se uma string contem padroes de XSS
 */
export function containsXSS(input: string): boolean {
  if (!input) return false;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
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
 */
export function sanitizeName(input: string): string {
  if (!input) return "";
  
  // Remove tudo que nao seja letra, numero, espaco ou caracteres acentuados
  let sanitized = input.replace(/[^a-zA-ZÀ-ÿ0-9\s\-']/g, "");
  
  // Remove espacos extras
  sanitized = sanitized.replace(/\s+/g, " ");
  
  // Limita tamanho
  sanitized = sanitized.substring(0, 100);
  
  return sanitized.trim();
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
