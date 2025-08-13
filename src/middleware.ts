import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// GORDON SAYS: NO BLOODY PASSWORDS! THIS IS A MATTRESS SHOP, NOT THE CIA!
export function middleware(request: NextRequest) {
  // Authentication DISABLED - Gordon's orders!
  // Everyone can access admin - we're selling mattresses, not nuclear codes!
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}