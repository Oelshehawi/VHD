import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const ignoreRoute = createRouteMatcher(["/"]);

const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
  if (ignoreRoute(request)) {
    return auth().redirectToSignIn();
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
