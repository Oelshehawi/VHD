import { clerkMiddleware, createRouteMatcher, auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define protected routes that require manage permissions
const manageRoutes = [
  '/database',
  '/payroll',
  '/dashboard',
  '/invoices$', // Only block the main invoices list with $ (exact match)
]

// Define routes that allow both managers and employees
const sharedRoutes = [
  '/invoices/', // Allow access to individual invoices
]

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/'])

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const path = request.nextUrl.pathname
  const { orgPermissions } = await auth()
  const hasManagePermission = orgPermissions?.includes("org:database:allow") ?? false

  // Allow access to shared routes regardless of permissions
  if (sharedRoutes.some(route => path.includes(route))) {
    // Continue to auth.protect() below
  }
  // Block non-managers from accessing manage routes
  else if (manageRoutes.some(route => path.match(new RegExp(`^${route}`)))) {
    if (!hasManagePermission) {
      return NextResponse.redirect(new URL('/employee-dashboard', request.url))
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}