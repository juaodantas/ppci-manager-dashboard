import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Token is stored in localStorage (client-side only); middleware uses a cookie fallback
  // The client sets this cookie via the auth context on login/logout
  const token = request.cookies.get('auth_token')?.value

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
