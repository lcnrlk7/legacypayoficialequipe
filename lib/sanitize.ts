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
