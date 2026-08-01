import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/secret";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

    if (pathname.startsWith("/portal")) {
      const session = request.cookies.get("smds_session")?.value;
      const payload = session ? verifySessionToken(session) : null;
      if (!payload) return NextResponse.redirect(new URL("/login", request.url));
      if (pathname.startsWith("/portal/dashboard") && payload.role !== "student") {
        return NextResponse.redirect(new URL(payload.role === "admin" ? "/portal/admin" : "/portal/instructor", request.url));
      }
      if (pathname.startsWith("/portal/instructor") && payload.role !== "instructor") {
        return NextResponse.redirect(new URL(payload.role === "admin" ? "/portal/admin" : "/portal/dashboard", request.url));
      }
      if (pathname.startsWith("/portal/admin") && payload.role !== "admin") {
        return NextResponse.redirect(new URL(payload.role === "instructor" ? "/portal/instructor" : "/portal/dashboard", request.url));
      }
      return NextResponse.next();
    }

  if (!pathname.startsWith("/api")) return NextResponse.next();

  const session = request.cookies.get("smds_session")?.value;
  const payload = session ? verifySessionToken(session) : null;

  const isPublic =
    pathname === "/api/public" ||
    pathname.startsWith("/api/public/") ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/health" ||
    pathname === "/api/cron" ||
    pathname === "/api/availability" ||
    pathname === "/api/payments/webhook" ||
    (pathname === "/api/certificates" && request.method === "POST");

  if (isPublic) return NextResponse.next();

  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (pathname.startsWith("/api/admin") && payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/portal/:path*"],
};
