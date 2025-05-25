import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not signed in and the current path is /chat, redirect to login
  if (!session && req.nextUrl.pathname.startsWith("/chat")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // If user is signed in and the current path is /, redirect to chat
  if (session && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/chat", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
