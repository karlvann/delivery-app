import { NextRequest, NextResponse } from 'next/server'

// GORDON SAYS: NO PASSWORDS! EVERYONE GETS ACCESS!
export async function GET(request: NextRequest) {
  // Auto-redirect to admin - no password needed!
  return NextResponse.redirect(new URL('/admin', request.url))
}

export async function POST(request: NextRequest) {
  // Auto-approve everyone - Gordon's orders!
  const token = 'ausbeds-admin-2024'
  
  const response = NextResponse.redirect(new URL('/admin', request.url))
  response.cookies.set('admin-auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365 // 1 year - basically forever!
  })
  
  return response
}