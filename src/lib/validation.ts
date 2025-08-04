/**
 * Utilitários de validação para melhorar a segurança da aplicação
 */

// Validação de CPF
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

// Validação de CNPJ
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
}

// Validação de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de telefone brasileiro
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // Aceita formatos: (11) 99999-9999 ou (11) 9999-9999
  return /^(\d{2})(\d{4,5})(\d{4})$/.test(cleanPhone);
}

// Sanitização de string para prevenir XSS
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validação de valor monetário
export function isValidCurrency(value: string): boolean {
  const currencyRegex = /^R\$\s?\d{1,3}(\.\d{3})*,\d{2}$/;
  return currencyRegex.test(value) || /^\d+([.,]\d{1,2})?$/.test(value);
}

// Validação de data no formato brasileiro
export function isValidDate(date: string): boolean {
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = date.match(dateRegex);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  const dateObj = new Date(year, month - 1, day);
  
  return dateObj.getFullYear() === year &&
         dateObj.getMonth() === month - 1 &&
         dateObj.getDate() === day;
}

// Validação de senha forte
export function isStrongPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validação de arquivo (tipo e tamanho)
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeInMB: number
): { isValid: boolean; error?: string } {
  // Verificar tipo
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
    };
  }
  
  // Verificar tamanho
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`
    };
  }
  
  return { isValid: true };
}

// Validação de entrada numérica
export function isValidNumber(
  value: string,
  min?: number,
  max?: number
): { isValid: boolean; error?: string } {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Valor deve ser um número válido' };
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, error: `Valor deve ser maior ou igual a ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `Valor deve ser menor ou igual a ${max}` };
  }
  
  return { isValid: true };
}

// Escape de caracteres para SQL (básico)
export function escapeSQLString(str: string): string {
  return str.replace(/'/g, "''");
}

// Validação de URL
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Rate limiting simples (para uso no frontend)
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove requisições antigas
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  reset(key: string): void {
    this.requests.delete(key);
  }
}

