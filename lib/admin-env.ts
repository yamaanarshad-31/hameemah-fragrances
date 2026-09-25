// Dev falls back to demo credentials; production refuses to run admin without real ones,
// because the fallbacks are visible to anyone who reads the source.
const dev = process.env.NODE_ENV !== "production";

export function adminSecret(): Uint8Array | null {
  const s = process.env.ADMIN_SECRET || (dev ? "dev-only-secret-change-me-please-32chars" : "");
  return s.length >= 32 ? new TextEncoder().encode(s) : null;
}

export function adminLogin(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL || (dev ? "admin@hameemah.com" : "");
  const password = process.env.ADMIN_PASSWORD || (dev ? "hameemah123" : "");
  return email && password ? { email: email.toLowerCase(), password } : null;
}
