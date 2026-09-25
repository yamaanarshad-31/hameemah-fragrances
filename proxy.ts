import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { adminSecret } from "./lib/admin-env";

// Optimistic gate for the admin area; every admin action re-checks the session itself.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const token = req.cookies.get("hf_admin")?.value;
  const key = adminSecret();
  let ok = false;
  if (token && key) {
    try {
      await jwtVerify(token, key);
      ok = true;
    } catch {}
  }
  if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
