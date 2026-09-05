/**
 * Lista oficial de e-mails com privilégios de Administrador / Desenvolvedor Master do Kaxxa.
 */
export const ADMIN_EMAILS: readonly string[] = [
  'somoskaxxa@gmail.com',
];

/**
 * Verifica se um e-mail possui permissões de Administrador / Desenvolvedor do Kaxxa.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
