import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const routeMap: Record<string, string> = {
  "/ferramenta": "/tool",
  "/historico": "/history",
  "/como-usar": "/how-it-works",
  "/sobre": "/about",
};

export function middleware(request: NextRequest) {
  const target = routeMap[request.nextUrl.pathname];

  if (target) {
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ferramenta", "/historico", "/como-usar", "/sobre"],
};
