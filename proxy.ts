import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/acceptToken(.*)",
  "/images/(.*)",
  "/favicon.ico",
  "/client-portal/auth-error",
  "/api/geocode",
  "/api/optimization",
  "/api/distance-matrix",
  "/api/cron/process-reminders",
  "/api/cron/process-reminders(.*)",
  "/api/cron/update-overdue-invoices",
  "/api/send-invoice(.*)",
  "/api/availability",
  "/api/timeoff",
  "/api/markChequeAsPaid",
  "/api/cloudinaryUpload",
]);

// Define client portal routes
const isClientPortalRoute = createRouteMatcher([
  "/client-portal/((?!auth-error).*)",
]);


export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Check user types
  const isManager = (sessionClaims as any)?.metadata?.isManager === true;
  const isClientPortalUser =
    (sessionClaims as any)?.metadata?.isClientPortalUser === true;

  // Handle public routes - always accessible
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to sign-in
  if (!userId) {
    // Special case for client portal
    if (isClientPortalRoute(req)) {
      return NextResponse.redirect(
        new URL("/client-portal/auth-error", req.url),
      );
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Redirect root to appropriate dashboard based on user type
  if (req.nextUrl.pathname === "/") {
    if (isClientPortalUser) {
      return NextResponse.redirect(
        new URL("/client-portal/dashboard", req.url),
      );
    } else if (isManager) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      // User is authenticated but neither manager nor client portal user
      // Redirect to sign-in since employees should use the phone app
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  // Access control based on user types
  if (isClientPortalUser) {
    // Client portal users should only access client portal routes
    if (!isClientPortalRoute(req)) {
      return NextResponse.redirect(
        new URL("/client-portal/dashboard", req.url),
      );
    }
  } else if (isManager) {
    // Managers can access both admin and client portal routes
    if (isClientPortalRoute(req)) {
      // Allow access to client portal
      return NextResponse.next();
    }
  } else {
    // User is authenticated but neither manager nor client portal user
    // Redirect to sign-in since employees should use the phone app
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Continue for all other valid routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
