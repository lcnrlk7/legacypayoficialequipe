// PIX Validation utilities

export interface PIXKeyValidation {
  isValid: boolean;
  type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  error?: string;
  formattedKey?: string;
}

export interface PIXQRCodeData {
  pixKey: string;
  keyType: string;
  name?: string;
  city?: string;
  amount?: number;
  description?: string;
  txId?: string;
  isValid: boolean;
  isDynamic?: boolean;
  dynamicUrl?: string;
}

/**
 * Validates a PIX key or extracts it from a complete PIX QR code
 */
export function validatePixKey(input: string): PIXKeyValidation {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Chave PIX inválida' };
  }

  const cleaned = input.trim();

  // Check if it's a complete PIX QR code (EMV format)
  // QR codes can start with 0002 followed by different numbers (01, 26, etc)
  if (cleaned.startsWith('0002') || cleaned.includes('br.gov.bcb.pix')) {
    // It's a valid QR code string - return as valid
    // The withdraw modal will parse it with parsePixQRCode
    return {
      isValid: true,
      type: 'random',
      formattedKey: cleaned,
    };
  }

  // Validate as individual key types
  const validationResults = [
    validateCPF(cleaned),
    validateCNPJ(cleaned),
    validateEmail(cleaned),
    validatePhone(cleaned),
    validateRandomKey(cleaned),
  ];

  // Return first valid result
  for (const result of validationResults) {
    if (result.isValid) {
      return result;
    }
  }

  return {
    isValid: false,
    error: 'Chave PIX inválida. Use CPF, CNPJ, email, telefone ou chave aleatória.',
  };
}

/**
 * Validates CPF format
 */
function validateCPF(key: string): PIXKeyValidation {
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  const cpfClean = key.replace(/\D/g, '');

  if (cpfClean.length !== 11) {
    return { isValid: false };
  }

  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cpfClean)) {
    return { isValid: false, error: 'CPF inválido' };
  }

  // Basic CPF validation (Luhn algorithm)
  const digits = cpfClean.split('').map(Number);
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += digits[i - 1] * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== digits[9]) {
    return { isValid: false, error: 'CPF inválido' };
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += digits[i - 1] * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== digits[10]) {
    return { isValid: false, error: 'CPF inválido' };
  }

  const formatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return { isValid: true, type: 'cpf', formattedKey: formatted };
}

/**
 * Validates CNPJ format
 */
function validateCNPJ(key: string): PIXKeyValidation {
  const cnpjClean = key.replace(/\D/g, '');

  if (cnpjClean.length !== 14) {
    return { isValid: false };
  }

  // Check if all digits are the same (invalid CNPJ)
  if (/^(\d)\1{13}$/.test(cnpjClean)) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  // Basic CNPJ validation
  let sum = 0;
  let remainder;
  const digits = cnpjClean.split('').map(Number);

  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 8 === 0 ? 5 : i % 8 === 1 ? 4 : i % 8 === 2 ? 3 : i % 8 === 3 ? 2 : i % 8 === 4 ? 9 : i % 8 === 5 ? 8 : i % 8 === 6 ? 7 : 6);
  }

  remainder = sum % 11;
  remainder = remainder < 2 ? 0 : 11 - remainder;
  if (remainder !== digits[12]) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * (i % 8 === 0 ? 6 : i % 8 === 1 ? 5 : i % 8 === 2 ? 4 : i % 8 === 3 ? 3 : i % 8 === 4 ? 2 : i % 8 === 5 ? 9 : i % 8 === 6 ? 8 : 7);
  }

  remainder = sum % 11;
  remainder = remainder < 2 ? 0 : 11 - remainder;
  if (remainder !== digits[13]) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  const formatted = cnpjClean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return { isValid: true, type: 'cnpj', formattedKey: formatted };
}

/**
 * Validates email format
 */
function validateEmail(key: string): PIXKeyValidation {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(key)) {
    return { isValid: false };
  }
  return { isValid: true, type: 'email', formattedKey: key.toLowerCase() };
}

/**
 * Validates phone format (Brazilian format)
 */
function validatePhone(key: string): PIXKeyValidation {
  const phoneClean = key.replace(/\D/g, '');

  // Brazilian phone: 11 digits (2 area + 9 number)
  if (phoneClean.length !== 11) {
    return { isValid: false };
  }

  // First digit should be 1-9, second can be 1-9, and starts with +55 or just the number
  if (!/^[1-9]{2}9\d{8}$/.test(phoneClean)) {
    return { isValid: false, error: 'Telefone inválido' };
  }

  const formatted = phoneClean.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '+55 $1 $2 $3-$4');
  return { isValid: true, type: 'phone', formattedKey: formatted };
}

/**
 * Validates random PIX key (UUID format or alphanumeric)
 */
function validateRandomKey(key: string): PIXKeyValidation {
  // UUID format: 8-4-4-4-12 hex digits
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(key)) {
    return { isValid: true, type: 'random', formattedKey: key.toLowerCase() };
  }

  return { isValid: false };
}

/**
 * Parses EMV TLV format used in PIX QR Codes - more robust version
 */
function parseEMVField(data: string, startPos: number): { id: string; value: string; nextPos: number } | null {
  if (startPos + 4 > data.length) return null;
  
  const id = data.substring(startPos, startPos + 2);
  const lengthStr = data.substring(startPos + 2, startPos + 4);
  const length = parseInt(lengthStr, 10);
  
  if (isNaN(length) || length < 0 || startPos + 4 + length > data.length) {
    return null;
  }
  
  const value = data.substring(startPos + 4, startPos + 4 + length);
  return { id, value, nextPos: startPos + 4 + length };
}

function parseAllEMVFields(data: string): Map<string, string> {
  const result = new Map<string, string>();
  let position = 0;
  
  while (position < data.length) {
    const field = parseEMVField(data, position);
    if (!field) break;
    result.set(field.id, field.value);
    position = field.nextPos;
  }
  
  return result;
}

/**
 * Parses a complete PIX QR Code and extracts all data
 * Supports multiple QR code formats and variations
 */
export function parsePixQRCode(qrCode: string): PIXQRCodeData {
  const defaultResult: PIXQRCodeData = {
    pixKey: '',
    keyType: 'DESCONHECIDO',
    isValid: false,
  };
  
  try {
    const cleaned = qrCode.trim();
    
    // Check if it looks like a PIX QR Code
    if (!cleaned.startsWith('0002') && !cleaned.includes('br.gov.bcb.pix')) {
      // Maybe it's just a PIX key
      const keyType = detectPixKeyType(cleaned);
      if (keyType !== 'PIX') {
        return {
          pixKey: cleaned,
          keyType,
          isValid: true,
        };
      }
      return defaultResult;
    }
    
    const emv = parseAllEMVFields(cleaned);
    
    // Try to find PIX data in fields 26, 27, 28, 29 (different acquirers use different fields)
    let pixKey = '';
    let description = '';
    let isDynamic = false;
    let dynamicUrl = '';
    
    for (const fieldId of ['26', '27', '28', '29']) {
      const pixData = emv.get(fieldId);
      if (pixData && pixData.includes('br.gov.bcb.pix')) {
        const pixFields = parseAllEMVFields(pixData);
        
        // Field 01 in PIX merchant data = PIX Key (static QR)
        // Field 02 = Description
        // Field 25 = URL (dynamic QR)
        pixKey = pixFields.get('01') || '';
        description = pixFields.get('02') || '';
        
        // Check for dynamic QR (field 25 contains URL)
        const urlField = pixFields.get('25');
        if (urlField && urlField.includes('.')) {
          isDynamic = true;
          dynamicUrl = urlField;
          // For dynamic QR, the URL IS the key
          if (!pixKey) {
            pixKey = urlField;
          }
        }
        
        if (pixKey) break;
      }
    }
    
    // Try to extract URL from the raw QR code if not found yet
    if (!dynamicUrl) {
      // Look for URL patterns in the raw string - more comprehensive patterns
      const urlPatterns = [
        // Common PSP URL patterns
        /([a-zA-Z0-9-]+\.onlyup\.com\.br\/[^\s\d]{5,}[a-zA-Z0-9\/-]+)/i,
        /([a-zA-Z0-9-]+\.mercadopago\.com\.br\/[^\s]+)/i,
        /([a-zA-Z0-9-]+\.pagseguro\.com\.br\/[^\s]+)/i,
        /(pix\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]+)/i,
        // Generic URL patterns  
        /([a-zA-Z0-9.-]+\.com\.br\/qr\/[^\s]+)/i,
        /([a-zA-Z0-9.-]+\.com\.br\/pix\/[^\s]+)/i,
        /([a-zA-Z0-9.-]+\.com\.br\/v[0-9]\/[^\s]+)/i,
        /(https?:\/\/[a-zA-Z0-9.-]+\/[^\s]+)/i,
      ];
      
      for (const pattern of urlPatterns) {
        const match = cleaned.match(pattern);
        if (match && match[1]) {
          // Clean up the URL - remove trailing numbers that might be CRC
          let url = match[1];
          // Remove trailing 4-digit CRC code if present
          url = url.replace(/\d{4}$/, '');
          // Remove trailing digits that look like field IDs
          url = url.replace(/\d{2,4}$/, '');
          
          dynamicUrl = url;
          isDynamic = true;
          break;
        }
      }
    }
    
    // If pixKey looks like a URL, mark as dynamic
    if (pixKey && pixKey.includes('.com') && pixKey.includes('/')) {
      isDynamic = true;
      if (!dynamicUrl) {
        dynamicUrl = pixKey;
      }
    }
    
    // If still no key, try regex extraction as fallback
    if (!pixKey) {
      // Try to extract UUID (random key)
      const uuidMatch = cleaned.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (uuidMatch) {
        pixKey = uuidMatch[1];
      }
      
      // Try to extract email
      if (!pixKey) {
        const emailMatch = cleaned.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          pixKey = emailMatch[1];
        }
      }
      
      // Try to extract CPF (11 digits)
      if (!pixKey) {
        const cpfMatch = cleaned.match(/\d{11}/);
        if (cpfMatch) {
          pixKey = cpfMatch[0];
        }
      }
    }
    
    // If we found a dynamic URL but no pixKey, use the URL as key
    if (dynamicUrl && !pixKey) {
      pixKey = dynamicUrl;
    }
    
    // Extract amount - field 54
    const amountStr = emv.get('54') || '';
    let amount: number | undefined;
    if (amountStr) {
      const parsedAmount = parseFloat(amountStr);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        amount = parsedAmount;
      }
    }
    
    // Extract name - field 59
    const name = emv.get('59') || '';
    
    // Extract city - field 60
    const city = emv.get('60') || '';
    
    // Extract txId from field 62
    const additionalData = emv.get('62') || '';
    const additionalFields = parseAllEMVFields(additionalData);
    const txId = additionalFields.get('05') || '';
    
    // Detect key type
    const keyType = pixKey ? detectPixKeyType(pixKey) : 'DESCONHECIDO';
    
    return {
      pixKey,
      keyType,
      name: name || undefined,
      city: city || undefined,
      amount,
      description: description || undefined,
      txId: txId || undefined,
      isValid: !!pixKey,
      isDynamic,
      dynamicUrl: dynamicUrl || undefined,
    };
  } catch (error) {
    return defaultResult;
  }
}

/**
 * Extracts PIX key from a complete QR code string
 */
export function extractPixKeyFromQRCode(qrCode: string): string | null {
  const parsed = parsePixQRCode(qrCode);
  return parsed.isValid ? parsed.pixKey : null;
}

/**
 * Detects the type of PIX key
 */
export function detectPixKeyType(key: string): string {
  const cleaned = key.trim();
  
  // CPF: 11 digits
  if (/^\d{11}$/.test(cleaned.replace(/\D/g, '')) && cleaned.replace(/\D/g, '').length === 11) {
    return 'CPF';
  }
  
  // CNPJ: 14 digits
  if (/^\d{14}$/.test(cleaned.replace(/\D/g, '')) && cleaned.replace(/\D/g, '').length === 14) {
    return 'CNPJ';
  }
  
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return 'EMAIL';
  }
  
  // Phone: starts with +55 or has 10-11 digits
  if (/^\+55/.test(cleaned) || /^\d{10,11}$/.test(cleaned.replace(/\D/g, ''))) {
    return 'TELEFONE';
  }
  
  // Random key (EVP): UUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned)) {
    return 'ALEATORIA';
  }
  
  // EMV/QR Code
  if (cleaned.startsWith('00020126') || cleaned.includes('br.gov.bcb.pix')) {
    return 'QR CODE';
  }
  
  return 'PIX';
}

/**
 * Formats currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Calculates withdrawal fee based on amount
 */
export function calculateWithdrawalFee(
  amount: number, 
  fixedFee: number = 5, 
  acquirerFee: number = 5
): { amount: number; fee: number; acquirerFee: number; totalFee: number; netAmount: number; total: number } {
  // Taxa fixa da Hyperion Pay + Taxa fixa da adquirente (Medusa/MisticPay)
  const totalFee = fixedFee + acquirerFee;
  const netAmount = amount - totalFee;
  
  return {
    amount,
    fee: Number(fixedFee.toFixed(2)),
    acquirerFee: Number(acquirerFee.toFixed(2)),
    totalFee: Number(totalFee.toFixed(2)),
    netAmount: Number(Math.max(0, netAmount).toFixed(2)),
    total: Number(amount.toFixed(2)), // Total debitado do saldo
  };
}
