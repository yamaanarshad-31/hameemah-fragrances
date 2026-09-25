import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { adminLogin, adminSecret } from "./admin-env";

export const COOKIE = "hf_admin";
const secret = () => {
  const s = adminSecret();
  if (!s) throw new Error("ADMIN_SECRET must be set (at least 32 characters)");
  return s;
};

export function checkCredentials(email: string, password: string) {
  const want = adminLogin();
  if (!want || !adminSecret()) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(want.password);
  return email.trim().toLowerCase() === want.email && a.length === b.length && timingSafeEqual(a, b);
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
  const key = adminSecret();
  if (!token || !key) return false;
  try {
    await jwtVerify(token, key);
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
