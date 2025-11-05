export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove potentially dangerous characters
  let sanitized = input.trim();

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URLs that might contain scripts
  sanitized = sanitized.replace(/data:[^;]*;base64,[a-zA-Z0-9+/=]*/g, '');

  return sanitized;
}

export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';

  // Basic HTML sanitization - allow only safe tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  let sanitized = html;

  // Remove script and style tags completely
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/ on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/ on\w+='[^']*'/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URLs that might contain scripts
  sanitized = sanitized.replace(/data:[^;]*;base64,[a-zA-Z0-9+/=]*/g, '');

  return sanitized;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic phone validation - adjust regex as needed for your region
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function escapeSqlLike(value: string): string {
  if (typeof value !== 'string') return '';

  return value.replace(/[%_\\]/g, '\\$&');
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
