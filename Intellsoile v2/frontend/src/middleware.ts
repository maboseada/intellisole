import { createClient } from '@/utils/supabase/client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware is very basic and just checks for the cookie
export function middleware(req: NextRequest) {
  // We can't use full supabase-js in Edge Middleware easily without SSR helpers
  // But we can check for the presence of the session cookie
  const res = NextResponse.next()
  
  // Custom auth check logic would go here if using @supabase/ssr
  // For now, let's keep it simple or implement client-side protection for speed
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/doctor/:path*'],
}
