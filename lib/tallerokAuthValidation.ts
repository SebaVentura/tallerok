const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthValidationResult = { ok: true } | { ok: false; message: string };

export function validateLoginForm(email: string, password: string): AuthValidationResult {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { ok: false, message: 'Ingresá tu email.' };
  }
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { ok: false, message: 'Ingresá un email válido.' };
  }
  if (!password) {
    return { ok: false, message: 'Ingresá tu contraseña.' };
  }
  return { ok: true };
}

export function validateRegisterForm(input: {
  tallerNombre: string;
  ownerNombre: string;
  email: string;
  password: string;
  confirmPassword: string;
}): AuthValidationResult {
  if (!input.tallerNombre.trim()) {
    return { ok: false, message: 'Ingresá el nombre del taller.' };
  }
  if (!input.ownerNombre.trim()) {
    return { ok: false, message: 'Ingresá tu nombre.' };
  }
  const emailCheck = validateLoginForm(input.email, input.password);
  if (!emailCheck.ok) {
    return emailCheck;
  }
  if (input.password.length < 8) {
    return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, message: 'Las contraseñas no coinciden.' };
  }
  return { ok: true };
}

export function validateEmailOptional(email: string): AuthValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { ok: true };
  if (!EMAIL_REGEX.test(trimmed)) {
    return { ok: false, message: 'Ingresá un email válido.' };
  }
  return { ok: true };
}
