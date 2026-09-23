import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";

export const COOKIE = "hf_admin";
const secret = () => new TextEncoder().encode(process.env.ADMIN_SECRET || "dev-only-secret-change-me-please-32chars");

export function checkCredentials(email: string, password: string) {
  const wantEmail = (process.env.ADMIN_EMAIL || "admin@hameemah.com").toLowerCase();
  const wantPass = process.env.ADMIN_PASSWORD || "hameemah123";
  const a = Buffer.from(password);
  const b = Buffer.from(wantPass);
  return email.trim().toLowerCase() === wantEmail && a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function verifyToken(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export async function isAdmin() {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

/** Call at the top of every admin server action / page. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
