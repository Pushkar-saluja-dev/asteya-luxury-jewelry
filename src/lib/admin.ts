/**
 * ASTEYA Joaillerie: Admin Security Registry
 * 
 * Simply add your email address to this list below! 
 * Anyone logged in with an email in this list (via Clerk or guest portal) 
 * will automatically see and have access to the "Curator Panel".
 */
export const ALLOWED_ADMIN_EMAILS = [
  "admin@asteya.com",
  "pushk@asteya-paris.com",
  "pushk@asteya.com",
  "pushkarsaluja2008@gmail.com", // Feel free to add your own email here!
];

/**
 * Validates if an email has Curator administrative privileges
 */
export function checkIsAdmin(email?: string): boolean {
  if (!email) return false;
  return ALLOWED_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}
