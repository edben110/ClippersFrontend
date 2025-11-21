import CryptoJS from 'crypto-js'

/**
 * Hashea una contraseña usando SHA-256
 * Esto oculta la contraseña en el network tab pero mantiene compatibilidad con el backend
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString()
}
