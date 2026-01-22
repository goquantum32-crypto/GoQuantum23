
// Utilitários de Segurança para o Frontend

// Remove caracteres perigosos que podem ser usados em ataques XSS (Cross-Site Scripting)
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Validação básica de email para evitar formatos maliciosos
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Ofuscação simples para comparação de credenciais (client-side)
// Nota: Em produção real, isto deve ser feito no servidor com bcrypt/argon2
export const checkAdminCredentials = (inputPass: string): boolean => {
  // A senha "nhamposse2004@" em Base64 é: bmhhbXBvc3NlMjAwNEA=
  try {
    return btoa(inputPass) === 'bmhhbXBvc3NlMjAwNEA=';
  } catch (e) {
    return false;
  }
};

// Validação de estrutura de dados para prevenir injeção via LocalStorage
export const validateUserStructure = (user: any): boolean => {
  return user && typeof user.id === 'string' && typeof user.name === 'string' && typeof user.role === 'string';
};
